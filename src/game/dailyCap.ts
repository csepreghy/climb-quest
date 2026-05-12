// Streak-friendly soft daily chalk cap with diminishing returns.
// Cap = base + level_step × level + streak_step × min(streak, streak_max_days).
// Past 100% of cap, chalk earns at tier1_mult; past tier2_threshold × cap, at tier2_mult.
import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { State, BoulderLog } from "./store";
import { LEVELS } from "./data";

/** Cost to reach the next level from the given level (uses last delta for max level). */
function costToNextLevel(level: number): number {
  const sorted = [...LEVELS].sort((a, b) => a.level - b.level);
  const idx = sorted.findIndex(l => l.level === level);
  if (idx < 0) return 0;
  if (idx < sorted.length - 1) return Math.max(0, sorted[idx + 1].cost - sorted[idx].cost);
  // Max level: reuse the previous delta so the cap stays in the same exponential band.
  if (idx > 0) return Math.max(0, sorted[idx].cost - sorted[idx - 1].cost);
  return 0;
}

export interface DailyCapConfig {
  enabled: boolean;
  base: number;
  levelStep: number;
  streakStep: number;
  streakMaxDays: number;
  tier1Threshold: number;
  tier1Mult: number;
  tier2Threshold: number;
  tier2Mult: number;
}

export const DEFAULT_DAILY_CAP_CONFIG: DailyCapConfig = {
  enabled: true,
  base: 100,
  // Percent of next-level cost added to the daily cap. Makes caps grow with the
  // level-cost curve (exponential), instead of a fixed per-level step.
  levelStep: 25,
  streakStep: 25,
  streakMaxDays: 30,
  tier1Threshold: 1.0,
  tier1Mult: 0.5,
  tier2Threshold: 2.0,
  tier2Mult: 0.2,
};

let config: DailyCapConfig = { ...DEFAULT_DAILY_CAP_CONFIG };
let overrides: Record<number, number> = {};
const listeners = new Set<() => void>();
function emit() { listeners.forEach(l => l()); }

export function getDailyCapConfig(): DailyCapConfig { return config; }
export function getDailyCapOverrides(): Record<number, number> { return overrides; }

async function refresh() {
  const [{ data }, { data: ovs }] = await Promise.all([
    supabase.from("daily_cap_config" as any).select("*").eq("id", "default").maybeSingle(),
    supabase.from("daily_cap_overrides" as any).select("level,cap"),
  ]);
  if (data) {
    const r: any = data;
    config = {
      enabled: !!r.enabled,
      base: Number(r.base),
      levelStep: Number(r.level_step),
      streakStep: Number(r.streak_step),
      streakMaxDays: Number(r.streak_max_days),
      tier1Threshold: Number(r.tier1_threshold),
      tier1Mult: Number(r.tier1_mult),
      tier2Threshold: Number(r.tier2_threshold),
      tier2Mult: Number(r.tier2_mult),
    };
  }
  const next: Record<number, number> = {};
  for (const row of (ovs as any[] | null) ?? []) {
    next[Number(row.level)] = Number(row.cap);
  }
  overrides = next;
  emit();
}

let initialized = false;
function ensureInit() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  refresh();
  const channel = supabase.channel("daily-cap-sync-" + Math.random().toString(36).slice(2, 8));
  channel
    .on("postgres_changes", { event: "*", schema: "public", table: "daily_cap_config" }, () => refresh())
    .on("postgres_changes", { event: "*", schema: "public", table: "daily_cap_overrides" }, () => refresh())
    .subscribe();
}
if (typeof window !== "undefined") ensureInit();

export function useDailyCapConfig(): DailyCapConfig {
  return useSyncExternalStore(
    cb => { ensureInit(); listeners.add(cb); return () => listeners.delete(cb); },
    () => config,
    () => config,
  );
}

export function useDailyCapOverrides(): Record<number, number> {
  return useSyncExternalStore(
    cb => { ensureInit(); listeners.add(cb); return () => listeners.delete(cb); },
    () => overrides,
    () => overrides,
  );
}

export async function setDailyCapOverride(level: number, cap: number | null): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (cap === null) {
    const { error } = await (supabase.from("daily_cap_overrides" as any) as any).delete().eq("level", level);
    if (error) throw error;
  } else {
    const { error } = await (supabase.from("daily_cap_overrides" as any) as any).upsert(
      { level, cap: Math.max(0, Math.round(cap)), updated_by: user?.id ?? null, updated_at: new Date().toISOString() },
      { onConflict: "level" },
    );
    if (error) throw error;
  }
  await refresh();
}

export async function setDailyCapConfig(values: Partial<DailyCapConfig>): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const row: any = { id: "default", updated_by: user?.id ?? null };
  if (values.enabled !== undefined) row.enabled = values.enabled;
  if (values.base !== undefined) row.base = Math.max(0, Math.round(values.base));
  if (values.levelStep !== undefined) row.level_step = Math.max(0, Math.round(values.levelStep));
  if (values.streakStep !== undefined) row.streak_step = Math.max(0, Math.round(values.streakStep));
  if (values.streakMaxDays !== undefined) row.streak_max_days = Math.max(1, Math.round(values.streakMaxDays));
  if (values.tier1Threshold !== undefined) row.tier1_threshold = Math.max(0, values.tier1Threshold);
  if (values.tier1Mult !== undefined) row.tier1_mult = Math.max(0, Math.min(1, values.tier1Mult));
  if (values.tier2Threshold !== undefined) row.tier2_threshold = Math.max(0, values.tier2Threshold);
  if (values.tier2Mult !== undefined) row.tier2_mult = Math.max(0, Math.min(1, values.tier2Mult));
  const { error } = await (supabase.from("daily_cap_config" as any) as any).upsert(row, { onConflict: "id" });
  if (error) throw error;
  await refresh();
}

// ---------- Pure helpers ----------

function dayKey(iso: string): string {
  return new Date(iso).toDateString();
}

/** Sum of chalk earned (logs + boss attempts + strength sessions) on the given local date. */
export function chalkUsedOnDate(s: State, dateISO: string): number {
  const target = dayKey(dateISO);
  let total = 0;
  for (const l of s.logs) if (dayKey(l.date) === target) total += l.chalkTotal;
  for (const b of s.bosses) for (const a of (b.attempts ?? [])) {
    if (dayKey(a.date) === target) total += a.chalk;
  }
  for (const ss of s.strengthSessions ?? []) {
    if (dayKey(ss.date) === target) total += ss.chalkTotal ?? 0;
  }
  return total;
}

/** Consecutive day streak ending at today (or yesterday if no log today). */
export function currentStreak(s: State): number {
  const days = new Set<string>();
  for (const l of s.logs) days.add(dayKey(l.date));
  for (const b of s.bosses) for (const a of b.attempts) days.add(dayKey(a.date));
  if (days.size === 0) return 0;

  const today = new Date();
  const todayKey = today.toDateString();
  const yesterday = new Date(today.getTime() - 86400000);
  let cursor = days.has(todayKey) ? today : (days.has(yesterday.toDateString()) ? yesterday : null);
  if (!cursor) return 0;
  let count = 0;
  while (days.has(cursor.toDateString())) {
    count++;
    cursor = new Date(cursor.getTime() - 86400000);
  }
  return count;
}

/** Default (formula) cap for a level, ignoring any admin override. */
export function defaultDailyCap(level: number, cfg: DailyCapConfig = config): number {
  const levelBoost = Math.round(costToNextLevel(level) * (cfg.levelStep / 100));
  return Math.max(0, cfg.base + levelBoost);
}

export function computeDailyCap(level: number, cfg: DailyCapConfig = config, ovs: Record<number, number> = overrides): number {
  const override = ovs[level];
  if (typeof override === "number" && override >= 0) return Math.round(override);
  return defaultDailyCap(level, cfg);
}

export interface CapApplication {
  /** Granted chalk after diminishing returns. */
  granted: number;
  /** True if the cap reduced the amount (or the log straddled a tier boundary). */
  reduced: boolean;
  /** Human-readable label describing the strongest tier hit (e.g. "Daily cap (×0.5)"). */
  label: string | null;
  cap: number;
  used: number;
}

/** Apply the soft cap to a fresh chalk amount given current usage. */
export function applyDailyCap(
  amount: number,
  used: number,
  cap: number,
  cfg: DailyCapConfig = config,
): CapApplication {
  if (!cfg.enabled || cap <= 0 || amount <= 0) {
    return { granted: amount, reduced: false, label: null, cap, used };
  }
  const t1 = cfg.tier1Threshold * cap;
  const t2 = cfg.tier2Threshold * cap;
  let pos = used;
  let remaining = amount;
  let granted = 0;
  let strongest: { mult: number; label: string } | null = null;

  // Tier 0: [0, t1] — full
  if (pos < t1 && remaining > 0) {
    const take = Math.min(remaining, t1 - pos);
    granted += take;
    pos += take; remaining -= take;
  }
  // Tier 1: [t1, t2]
  if (pos < t2 && remaining > 0) {
    const take = Math.min(remaining, t2 - pos);
    granted += take * cfg.tier1Mult;
    pos += take; remaining -= take;
    strongest = { mult: cfg.tier1Mult, label: `Daily cap (×${cfg.tier1Mult})` };
  }
  // Tier 2: > t2
  if (remaining > 0) {
    granted += remaining * cfg.tier2Mult;
    strongest = { mult: cfg.tier2Mult, label: `Daily cap (×${cfg.tier2Mult})` };
  }
  const grantedRounded = Math.max(0, Math.round(granted));
  return {
    granted: grantedRounded,
    reduced: grantedRounded < amount,
    label: strongest?.label ?? null,
    cap,
    used,
  };
}
