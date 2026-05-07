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

/** Returns a level definition merged with any override. Text/chalk are shared across genders; image is per-gender. */
export function resolvedLevel(level: number, gender: Gender): ClimberLevel & { image?: string | null } {
  const base = LEVELS.find(l => l.level === level) ?? LEVELS[0];
  const own = state.map.get(k(level, gender));
  const other = state.map.get(k(level, gender === "male" ? "female" : "male"));
  const pickText = (key: "name" | "tagline") =>
    (own?.[key]?.trim() ? own[key] : other?.[key]?.trim() ? other[key] : null) as string | null;
  const sharedChalk = own?.chalkReq != null ? own.chalkReq : other?.chalkReq != null ? other.chalkReq : null;
  const name = pickText("name");
  const tagline = pickText("tagline");
  return {
    ...base,
    title: name ?? base.title,
    desc: tagline ?? base.desc,
    cost: sharedChalk != null ? sharedChalk : base.cost,
    image: own?.image ?? null,
  };
}

/** True if any per-gender override row exists for this level (text/chalk/image). */
export function hasAnyOverride(level: number): boolean {
  return !!state.map.get(k(level, "male")) || !!state.map.get(k(level, "female"));
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

export interface SharedLevelInput {
  name?: string | null;
  tagline?: string | null;
  chalkReq?: number | null;
  /** Per-gender image: undefined = leave alone, null = clear, File = upload. */
  maleImageFile?: File | null;
  femaleImageFile?: File | null;
  clearMaleImage?: boolean;
  clearFemaleImage?: boolean;
}

/** Save level data: text/chalk are mirrored to both gender rows; image is per-gender. */
export async function saveLevel(level: number, input: SharedLevelInput): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const updatedBy = user?.id ?? null;

  const existingMale = state.map.get(k(level, "male"));
  const existingFemale = state.map.get(k(level, "female"));

  let maleImage: string | null | undefined = existingMale?.image ?? null;
  let femaleImage: string | null | undefined = existingFemale?.image ?? null;
  if (input.maleImageFile) maleImage = await uploadLevelImage(level, "male", input.maleImageFile);
  if (input.femaleImageFile) femaleImage = await uploadLevelImage(level, "female", input.femaleImageFile);
  if (input.clearMaleImage) {
    await supabase.storage.from("level-images").remove([`male/level-${level}.webp`]).catch(() => {});
    maleImage = null;
  }
  if (input.clearFemaleImage) {
    await supabase.storage.from("level-images").remove([`female/level-${level}.webp`]).catch(() => {});
    femaleImage = null;
  }

  const sharedRow = {
    name: input.name ?? null,
    tagline: input.tagline ?? null,
    chalk_req: input.chalkReq ?? null,
    updated_by: updatedBy,
  };

  const rows = [
    { level, gender: "male", ...sharedRow, image: maleImage },
    { level, gender: "female", ...sharedRow, image: femaleImage },
  ];

  const { error } = await (supabase.from("level_overrides") as any)
    .upsert(rows, { onConflict: "level,gender" });
  if (error) throw error;
  await refresh();
}

export async function clearLevel(level: number): Promise<void> {
  await supabase.storage.from("level-images").remove([
    `male/level-${level}.webp`,
    `female/level-${level}.webp`,
  ]).catch(() => {});
  const { error } = await supabase.from("level_overrides").delete().eq("level", level);
  if (error) throw error;
  await refresh();
}
