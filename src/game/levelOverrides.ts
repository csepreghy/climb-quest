// Admin-managed per-gender level overrides (name, tagline, chalk req, image).
import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LEVELS, Gender, ClimberLevel } from "./data";
import { toWebpBlob } from "@/lib/imageUpload";

export interface LevelOverride {
  level: number;
  gender: Gender;
  name: string | null;
  tagline: string | null;
  chalkReq: number | null;
  image: string | null;
}

type Key = `${number}:${Gender}`;
const k = (lvl: number, g: Gender): Key => `${lvl}:${g}` as Key;

interface S { map: Map<Key, LevelOverride>; loaded: boolean; }
let state: S = { map: new Map(), loaded: false };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

function rowToOverride(r: any): LevelOverride {
  return {
    level: r.level,
    gender: r.gender,
    name: r.name,
    tagline: r.tagline,
    chalkReq: r.chalk_req,
    image: r.image,
  };
}

async function refresh() {
  const { data } = await supabase.from("level_overrides").select("*");
  const map = new Map<Key, LevelOverride>();
  (data ?? []).forEach((r: any) => {
    const o = rowToOverride(r);
    map.set(k(o.level, o.gender), o);
  });
  state = { map, loaded: true };
  emit();
}

let initialized = false;
function ensureInit() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  refresh();
  supabase
    .channel("level-overrides-sync-" + Math.random().toString(36).slice(2, 8))
    .on("postgres_changes", { event: "*", schema: "public", table: "level_overrides" }, () => refresh())
    .subscribe();
}

function subscribe(cb: () => void) {
  ensureInit();
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

export function useLevelOverrides(): Map<Key, LevelOverride> {
  return useSyncExternalStore(subscribe, () => state.map, () => state.map);
}

export function getOverride(level: number, gender: Gender): LevelOverride | undefined {
  return state.map.get(k(level, gender));
}

/** Returns a level definition merged with any override for the given gender. */
export function resolvedLevel(level: number, gender: Gender): ClimberLevel & { image?: string | null } {
  const base = LEVELS.find(l => l.level === level) ?? LEVELS[0];
  const o = state.map.get(k(level, gender));
  return {
    ...base,
    title: o?.name?.trim() ? o.name : base.title,
    desc: o?.tagline?.trim() ? o.tagline : base.desc,
    cost: o?.chalkReq != null ? o.chalkReq : base.cost,
    image: o?.image ?? null,
  };
}

export interface LevelOverrideInput {
  name?: string | null;
  tagline?: string | null;
  chalkReq?: number | null;
  imageFile?: File | null;
  /** Pass null to clear the existing image. */
  image?: string | null;
}

async function uploadLevelImage(level: number, gender: Gender, file: File): Promise<string> {
  const blob = await toWebpBlob(file);
  const path = `${gender}/level-${level}.webp`;
  const { error } = await supabase.storage
    .from("level-images")
    .upload(path, blob, { contentType: "image/webp", upsert: true, cacheControl: "31536000" });
  if (error) throw error;
  const { data } = supabase.storage.from("level-images").getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

export async function saveLevelOverride(level: number, gender: Gender, input: LevelOverrideInput): Promise<void> {
  let image: string | null | undefined = input.image;
  if (input.imageFile) image = await uploadLevelImage(level, gender, input.imageFile);

  const row: any = { level, gender };
  if (input.name !== undefined) row.name = input.name;
  if (input.tagline !== undefined) row.tagline = input.tagline;
  if (input.chalkReq !== undefined) row.chalk_req = input.chalkReq;
  if (image !== undefined) row.image = image;

  const { data: { user } } = await supabase.auth.getUser();
  row.updated_by = user?.id ?? null;

  const { error } = await (supabase.from("level_overrides") as any)
    .upsert(row, { onConflict: "level,gender" });
  if (error) throw error;
  await refresh();
}

export async function clearLevelOverride(level: number, gender: Gender): Promise<void> {
  await supabase.storage.from("level-images").remove([`${gender}/level-${level}.webp`]).catch(() => {});
  const { error } = await supabase.from("level_overrides").delete().eq("level", level).eq("gender", gender);
  if (error) throw error;
  await refresh();
}
