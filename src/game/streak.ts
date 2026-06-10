// Streak system: weekly bonus cycle + post-7-day buffs + 14/21/30 milestone rewards.
import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { State } from "./store";

export type BuffKind = "chalk" | "crit" | "cap";

export interface ActiveBuff {
  id: string;
  kind: BuffKind;
  pct: number;             // percentage points (e.g. 20 = +20%)
  expiresAt: string;       // ISO timestamp
  source?: string;         // human-readable origin ("Day 7 streak", "Day 14 milestone", ...)
}

export interface StreakMilestone {
  day: number;
  label: string;
  buffs: { kind: BuffKind; pct: number; days: number }[];
  /** Multiplier of current daily cap granted as one-time chalk. */
  chalkCacheMult?: number;
}

export interface StreakConfig {
  enabled: boolean;
  dayBonusPcts: number[];   // length 7: bonus % for cycle day 1..7
  post7ChalkPct: number;
  post7ChalkDays: number;
  post7CritPct: number;
  post7CritDays: number;
  milestones: StreakMilestone[];
}

export const DEFAULT_STREAK_CONFIG: StreakConfig = {
  enabled: true,
  dayBonusPcts: [10, 10, 10, 10, 10, 10, 50],
  post7ChalkPct: 20,
  post7ChalkDays: 3,
  post7CritPct: 20,
  post7CritDays: 7,
  milestones: [
    { day: 14, label: "Two-Week Tenacity", buffs: [{ kind: "chalk", pct: 25, days: 5 }] },
    { day: 21, label: "Three-Week Titan",  buffs: [{ kind: "cap",   pct: 50, days: 7 }] },
    { day: 30, label: "Monthly Monk",      buffs: [{ kind: "chalk", pct: 30, days: 7 }], chalkCacheMult: 2 },
  ],
};

let config: StreakConfig = { ...DEFAULT_STREAK_CONFIG };
const listeners = new Set<() => void>();
function emit() { listeners.forEach(l => l()); }

export function getStreakConfig(): StreakConfig { return config; }

async function refresh() {
  const { data } = await supabase.from("streak_config" as any).select("*").eq("id", "default").maybeSingle();
  if (data) {
    const r: any = data;
    const dayPcts = Array.isArray(r.day_bonus_pcts) ? r.day_bonus_pcts.map((n: any) => Number(n)) : DEFAULT_STREAK_CONFIG.dayBonusPcts;
    config = {
      enabled: !!r.enabled,
      dayBonusPcts: dayPcts.length === 7 ? dayPcts : DEFAULT_STREAK_CONFIG.dayBonusPcts,
      post7ChalkPct: Number(r.post7_chalk_pct ?? 20),
      post7ChalkDays: Number(r.post7_chalk_days ?? 3),
      post7CritPct: Number(r.post7_crit_pct ?? 20),
      post7CritDays: Number(r.post7_crit_days ?? 7),
      milestones: Array.isArray(r.milestones) ? r.milestones : DEFAULT_STREAK_CONFIG.milestones,
    };
    emit();
  }
}

let initialized = false;
function ensureInit() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  refresh();
  const channel = supabase.channel("streak-config-sync-" + Math.random().toString(36).slice(2, 8));
  channel.on("postgres_changes", { event: "*", schema: "public", table: "streak_config" }, () => refresh()).subscribe();
}
if (typeof window !== "undefined") ensureInit();

export function useStreakConfig(): StreakConfig {
  return useSyncExternalStore(
    cb => { ensureInit(); listeners.add(cb); return () => listeners.delete(cb); },
    () => config,
    () => config,
  );
}

// ---------- Pure helpers ----------

/** Which day of the 7-day cycle (1..7) the player is on for a given streak length. */
export function cycleDay(streak: number): number {
  if (streak <= 0) return 0;
  return ((streak - 1) % 7) + 1;
}

/** Today's percentage chalk bonus, given streak length. 0 if no streak yet. */
export function streakDayBonusPct(streak: number, cfg: StreakConfig = config): number {
  if (!cfg.enabled || streak <= 0) return 0;
  const d = cycleDay(streak);
  return Math.max(0, Math.round(cfg.dayBonusPcts[d - 1] ?? 0));
}

function nowMs() { return Date.now(); }

export function cleanExpiredBuffs(buffs: ActiveBuff[] | undefined): ActiveBuff[] {
  if (!buffs || buffs.length === 0) return [];
  const now = nowMs();
  return buffs.filter(b => new Date(b.expiresAt).getTime() > now);
}

function sumBuffPct(buffs: ActiveBuff[] | undefined, kind: BuffKind): number {
  if (!buffs) return 0;
  const now = nowMs();
  let total = 0;
  for (const b of buffs) {
    if (b.kind !== kind) continue;
    if (new Date(b.expiresAt).getTime() <= now) continue;
    total += b.pct;
  }
  return total;
}

export function activeChalkBuffPct(s: State): number { return sumBuffPct(s.activeBuffs, "chalk"); }
export function activeCritBuffPct(s: State): number  { return sumBuffPct(s.activeBuffs, "crit"); }
export function activeCapBuffPct(s: State): number   { return sumBuffPct(s.activeBuffs, "cap"); }

export function activeBuffs(s: State): ActiveBuff[] {
  return cleanExpiredBuffs(s.activeBuffs);
}

function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 86400000);
}

/** Returns a new buff with a fresh id + expiry computed from now+days. */
export function makeBuff(kind: BuffKind, pct: number, days: number, source?: string): ActiveBuff {
  return {
    id: (typeof crypto !== "undefined" && "randomUUID" in crypto) ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    kind,
    pct: Math.max(0, Math.round(pct)),
    expiresAt: addDays(new Date(), Math.max(0, days)).toISOString(),
    source,
  };
}

/** Append buffs to state.activeBuffs, cleaning expired entries. */
export function withBuffs(s: State, toAdd: ActiveBuff[]): State {
  const cleaned = cleanExpiredBuffs(s.activeBuffs);
  if (toAdd.length === 0) return { ...s, activeBuffs: cleaned };
  return { ...s, activeBuffs: [...cleaned, ...toAdd] };
}

export interface StreakRewardResult {
  /** New buffs added by this streak progression. */
  addedBuffs: ActiveBuff[];
  /** Lump-sum chalk granted (e.g. Day 30 chalk cache). */
  chalkCache: number;
  /** Milestone IDs (their `day`) newly awarded so we don't double-grant. */
  awardedMilestoneDays: number[];
  /** Display label for a celebration banner, if any. */
  bannerLabel?: string;
}

/**
 * Given a streak change (prev → next), figure out what new rewards to grant.
 * - Whenever the player completes a 7-day cycle (next % 7 === 0 && next > prev), grants post-7-day buffs.
 * - When the streak first reaches a milestone day, grants its buffs + chalk cache.
 */
export function streakRewardsFor(
  prevStreak: number,
  nextStreak: number,
  s: State,
  currentDailyCap: number,
  cfg: StreakConfig = config,
): StreakRewardResult {
  const out: StreakRewardResult = { addedBuffs: [], chalkCache: 0, awardedMilestoneDays: [] };
  if (!cfg.enabled) return out;
  if (nextStreak <= prevStreak) return out;

  // Walk every newly-reached streak day so a multi-day jump still grants everything in order.
  const alreadyAwarded = new Set(s.streakMilestonesAwarded ?? []);
  for (let day = prevStreak + 1; day <= nextStreak; day++) {
    // Cycle completion (7, 14, 21, 28, ...): post-7-day buffs.
    if (day > 0 && day % 7 === 0) {
      if (cfg.post7ChalkPct > 0 && cfg.post7ChalkDays > 0) {
        out.addedBuffs.push(makeBuff("chalk", cfg.post7ChalkPct, cfg.post7ChalkDays, `Day ${day} streak`));
      }
      if (cfg.post7CritPct > 0 && cfg.post7CritDays > 0) {
        out.addedBuffs.push(makeBuff("crit", cfg.post7CritPct, cfg.post7CritDays, `Day ${day} streak`));
      }
      if (!out.bannerLabel) out.bannerLabel = `Day ${day} streak complete!`;
    }
    // Milestone rewards (14/21/30, configurable).
    const milestone = cfg.milestones.find(m => m.day === day);
    if (milestone && !alreadyAwarded.has(day)) {
      for (const b of milestone.buffs) {
        out.addedBuffs.push(makeBuff(b.kind, b.pct, b.days, milestone.label));
      }
      if (milestone.chalkCacheMult && currentDailyCap > 0) {
        out.chalkCache += Math.round(currentDailyCap * milestone.chalkCacheMult);
      }
      out.awardedMilestoneDays.push(day);
      out.bannerLabel = `${milestone.label} — Day ${day}!`;
    }
  }
  return out;
}

/** Rewards for a single specific day, ignoring "already awarded" tracking. Use for admin triggers / previews. */
export function rewardsForDay(
  day: number,
  currentDailyCap: number,
  cfg: StreakConfig = config,
): { addedBuffs: ActiveBuff[]; chalkCache: number; bannerLabel: string } {
  const out = { addedBuffs: [] as ActiveBuff[], chalkCache: 0, bannerLabel: `Day ${day} streak!` };
  if (day > 0 && day % 7 === 0) {
    if (cfg.post7ChalkPct > 0 && cfg.post7ChalkDays > 0) {
      out.addedBuffs.push(makeBuff("chalk", cfg.post7ChalkPct, cfg.post7ChalkDays, `Day ${day} streak`));
    }
    if (cfg.post7CritPct > 0 && cfg.post7CritDays > 0) {
      out.addedBuffs.push(makeBuff("crit", cfg.post7CritPct, cfg.post7CritDays, `Day ${day} streak`));
    }
    out.bannerLabel = `Day ${day} streak complete!`;
  }
  const milestone = cfg.milestones.find(m => m.day === day);
  if (milestone) {
    for (const b of milestone.buffs) {
      out.addedBuffs.push(makeBuff(b.kind, b.pct, b.days, milestone.label));
    }
    if (milestone.chalkCacheMult && currentDailyCap > 0) {
      out.chalkCache = Math.round(currentDailyCap * milestone.chalkCacheMult);
    }
    out.bannerLabel = `${milestone.label} — Day ${day}!`;
  }
  return out;
}

// ---------- Listeners for celebratory banners ----------

const eventListeners = new Set<(label: string) => void>();
export function onStreakEvent(cb: (label: string) => void): () => void {
  eventListeners.add(cb);
  return () => { eventListeners.delete(cb); };
}
export function emitStreakEvent(label: string) {
  setTimeout(() => eventListeners.forEach(l => { try { l(label); } catch {} }), 0);
}
