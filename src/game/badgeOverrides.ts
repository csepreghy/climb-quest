// Admin-managed badge overrides (title, description, rarity).
// Award logic stays in code; overrides only affect display metadata.
import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BADGES, BadgeDef, Rarity } from "./data";

export interface BadgeOverride {
  badgeId: string;
  title: string | null;
  description: string | null;
  flavor: string | null;
  rarity: Rarity | null;
}

interface S { map: Map<string, BadgeOverride>; loaded: boolean; }
let state: S = { map: new Map(), loaded: false };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

function rowToOverride(r: any): BadgeOverride {
  return {
    badgeId: r.badge_id,
    title: r.title,
    description: r.description,
    rarity: (r.rarity ?? null) as Rarity | null,
  };
}

async function refresh() {
  const { data } = await supabase.from("badge_overrides" as any).select("*");
  const map = new Map<string, BadgeOverride>();
  (data ?? []).forEach((r: any) => {
    const o = rowToOverride(r);
    map.set(o.badgeId, o);
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
    .channel("badge-overrides-sync-" + Math.random().toString(36).slice(2, 8))
    .on("postgres_changes", { event: "*", schema: "public", table: "badge_overrides" }, () => refresh())
    .subscribe();
}

function subscribe(cb: () => void) {
  ensureInit();
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

export function useBadgeOverrides(): Map<string, BadgeOverride> {
  return useSyncExternalStore(subscribe, () => state.map, () => state.map);
}

export function getBadgeOverride(id: string): BadgeOverride | undefined {
  return state.map.get(id);
}

/** Merge a badge def with any admin override. */
export function resolveBadge(def: BadgeDef): BadgeDef {
  const o = state.map.get(def.id);
  if (!o) return def;
  return {
    ...def,
    name: o.title?.trim() ? o.title : def.name,
    desc: o.description?.trim() ? o.description : def.desc,
    rarity: o.rarity ?? def.rarity,
  };
}

export function useResolvedBadges(): BadgeDef[] {
  const map = useBadgeOverrides();
  return BADGES.map(b => {
    const o = map.get(b.id);
    if (!o) return b;
    return {
      ...b,
      name: o.title?.trim() ? o.title : b.name,
      desc: o.description?.trim() ? o.description : b.desc,
      rarity: o.rarity ?? b.rarity,
    };
  });
}

export interface BadgeOverrideInput {
  title?: string | null;
  description?: string | null;
  rarity?: Rarity | null;
}

export async function saveBadgeOverride(badgeId: string, input: BadgeOverrideInput): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const row = {
    badge_id: badgeId,
    title: input.title ?? null,
    description: input.description ?? null,
    rarity: input.rarity ?? null,
    updated_by: user?.id ?? null,
  };
  const { error } = await (supabase.from("badge_overrides" as any))
    .upsert(row, { onConflict: "badge_id" });
  if (error) throw error;
  await refresh();
}

export async function clearBadgeOverride(badgeId: string): Promise<void> {
  const { error } = await supabase.from("badge_overrides" as any).delete().eq("badge_id", badgeId);
  if (error) throw error;
  await refresh();
}
