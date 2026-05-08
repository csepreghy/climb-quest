// Admin-tunable activity chalk rewards. Falls back to BASE_CHALK from data.ts.
import { useSyncExternalStore } from "react";
import { ActivityType, BASE_CHALK } from "./data";
import { supabase } from "@/integrations/supabase/client";

let rewards: Record<ActivityType, number> = { ...BASE_CHALK };
let loaded = false;
const listeners = new Set<() => void>();
function emit() { listeners.forEach(l => l()); }

export function getActivityRewards(): Record<ActivityType, number> {
  return rewards;
}

export function getActivityReward(a: ActivityType): number {
  return rewards[a] ?? BASE_CHALK[a] ?? 50;
}

async function refresh() {
  const { data } = await supabase.from("activity_rewards" as any).select("activity,value");
  if (data) {
    const next: Record<ActivityType, number> = { ...BASE_CHALK };
    for (const r of data as any[]) {
      if (r.activity in BASE_CHALK) next[r.activity as ActivityType] = Number(r.value);
    }
    rewards = next;
    loaded = true;
    emit();
  }
}

let initialized = false;
function ensureInit() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  refresh();
  const channel = supabase.channel("activity-rewards-sync-" + Math.random().toString(36).slice(2, 8));
  channel
    .on("postgres_changes", { event: "*", schema: "public", table: "activity_rewards" }, () => refresh())
    .subscribe();
}

export function useActivityRewards() {
  return useSyncExternalStore(
    cb => { ensureInit(); listeners.add(cb); return () => listeners.delete(cb); },
    () => rewards,
    () => rewards,
  );
}

export function isActivityRewardsLoaded() { return loaded; }

/** Admin-only: persist new values for the given activities. */
export async function setActivityRewards(values: Partial<Record<ActivityType, number>>): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const rows = Object.entries(values).map(([activity, value]) => ({
    activity, value: Math.max(0, Math.round(Number(value))), updated_by: user?.id ?? null,
  }));
  if (rows.length === 0) return;
  const { error } = await (supabase.from("activity_rewards" as any) as any)
    .upsert(rows, { onConflict: "activity" });
  if (error) throw error;
  await refresh();
}

// Eagerly initialise on import in browser so non-hook callers (computeChalk) see fresh values.
if (typeof window !== "undefined") ensureInit();
