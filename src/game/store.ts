import { useEffect, useSyncExternalStore } from "react";
import {
  ACTIVITY_LABELS, ActivityType, BADGES, BOSS_TEMPLATES,
  ITEM_BY_ID, LEVELS, ShopItem, Style, BossTemplate, Gender,
  GEAR_SLOTS, gearSlotsUnlocked, Slot, BUDDY_SLOT_UNLOCK_LEVEL,
} from "./data";
import { getItem } from "./customItems";
import { getActivityReward } from "./activityRewards";
import { resolvedLevel } from "./levelOverrides";
import { applyDailyCap, chalkUsedOnDate, computeDailyCap, currentStreak, getDailyCapConfig } from "./dailyCap";
import {
  activeChalkBuffPct, activeCritBuffPct, activeCapBuffPct,
  cleanExpiredBuffs, emitStreakEvent, getStreakConfig, streakDayBonusPct,
  streakRewardsFor, withBuffs, cycleDay, rewardsForDay,
} from "./streak";
import { tierFor, tierChalkPct, tierCritPct, TIER_LABEL } from "./strengthTier";

// ----- Types -----
export type AttemptType = "flash" | "send" | "project" | "repeat";

export interface BoulderLog {
  id: string;
  date: string;            // ISO
  activity: ActivityType;
  duration?: number;       // minutes
  location?: string;
  grade?: string;
  gradeMax?: string;       // optional grade range upper bound
  styles: Style[];
  problemsTried?: number;
  sends?: number;
  hardestSend?: string;
  notes?: string;
  chalkBase: number;
  chalkBonus: number;
  chalkTotal: number;
  isBoss?: boolean;
  attemptType?: AttemptType;
  holdColorId?: string;
  gymId?: string;
  /** Linked boss-project id, when this log was generated from a boss project. */
  bossId?: string;
}

export interface BossAttempt {
  id: string;
  date: string;
  outcome: "send" | "flash" | "attempt";
  chalk: number;
  notes?: string;
}

export interface Boss {
  id: string;
  /** Optional nickname. */
  name?: string;
  grade: string;
  /** Multi-style tags. Legacy single `style` migrated into here. */
  styles: Style[];
  gymId?: string;
  holdColorId?: string;
  notes?: string;
  /** ISO timestamp the boss project was created. Drives the 2-month deadline. */
  createdAt: string;
  /** True after the user successfully defeats the boss. */
  sent: boolean;
  sentDate?: string;
  /** True after the user admitted defeat (or it expired). Inactive but kept for stats. */
  defeated?: boolean;
  defeatedDate?: string;
  /** "admitted" if user manually admitted defeat, "expired" if past deadline. */
  defeatedReason?: "admitted" | "expired";
  // ----- legacy fields (kept optional for back-compat) -----
  style?: Style;
  difficulty?: number;
  emoji?: string;
  flavor?: string;
  attempts?: BossAttempt[];
  highPoint?: number;
  active?: boolean;
}

/** Maximum simultaneously-active boss projects per user. */
export const MAX_ACTIVE_BOSSES = 5;
/** Deadline before an unfinished boss auto-defeats the user. */
export const BOSS_DEADLINE_DAYS = 60;
/** Chalk penalty when a boss defeats the user (manual or expiry). */
export const BOSS_DEFEAT_PENALTY = 100;
export function bossExpiresAt(b: Boss): number {
  return new Date(b.createdAt).getTime() + BOSS_DEADLINE_DAYS * 86400000;
}
export function isBossExpired(b: Boss, now = Date.now()): boolean {
  return !b.sent && !b.defeated && now >= bossExpiresAt(b);
}

export type Equipped = Partial<Record<Slot, string>>;

export type StrengthWorkout = "core" | "pullup" | "pushup" | "squat" | "handstand" | "plank";
/** For hold sets (handstand hold, plank), `reps` stores seconds held. For pushup-style sets, `reps` is rep count. */
export interface StrengthSet { reps: number; restSeconds?: number; level?: number; mode?: "hold" | "pushup" }

/** Hold chalk rewards (single-rep timer-based). */
export const HOLD_REWARDS = {
  PR_BEAT: 200,
  FIRST_EVER: 100,
  TIER_50: 50,
  TIER_10: 10,
} as const;
/** Required unbroken duration (seconds) to defeat a hold-style strength boss. */
export const HOLD_BOSS_TARGET_SECONDS = 30;
/** Identifies hold-style strength exercises. Plank is always a hold; handstand depends on mode. */
export function isHoldExercise(workout: StrengthWorkout, mode?: "hold" | "pushup"): boolean {
  if (workout === "plank") return true;
  return workout === "handstand" && mode === "hold";
}
export interface StrengthSession {
  id: string;
  date: string;
  workout: StrengthWorkout;
  level: number;
  sets: StrengthSet[];
  totalReps: number;
  /** Chalk earned for this session (computed when logged). */
  chalkTotal?: number;
  /** True if this session was a strength-boss attempt that succeeded. */
  bossSend?: boolean;
}

/** Strength-level chalk multiplier (legacy — kept for any caller still using it). */
export function strengthLevelMult(level: number): number {
  return 1 + Math.max(0, level - 1) * 0.5;
}
/** Boss target: cumulative reps across attempts. */
export const STRENGTH_BOSS_TARGET = 10;
export const STRENGTH_BOSS_TARGET_HANDSTAND_SECONDS = 60;
export function strengthBossTarget(_workout: StrengthWorkout): number {
  return STRENGTH_BOSS_TARGET;
}
export function strengthBossTargetReps(_nextLevel?: number, _workout?: StrengthWorkout): number {
  return STRENGTH_BOSS_TARGET;
}
/**
 * Per-rep chalk based on how the chosen level compares to the user's max-unlocked level.
 * Top tier (max or boss attempt above max) = full reward; one below = 70%; two below = 50%; lower = 30%.
 * The admin "strength_rep" reward acts as the top-tier per-rep value (default 5).
 */
export function strengthRepChalk(level: number, maxUnlocked: number, playerLevel?: number): number {
  const pLvl = playerLevel ?? state.level;
  const top = Math.max(1, Math.round(getActivityReward("strength_rep") * activityLevelMult(pLvl)));
  const diff = maxUnlocked - level;
  if (diff <= 0) return top;
  if (diff === 1) return Math.max(1, Math.round(top * 0.7));
  if (diff === 2) return Math.max(1, Math.round(top * 0.5));
  return Math.max(1, Math.round(top * 0.3));
}

/**
 * Storage key for per-workout strength state. Handstand splits into hold vs pushup
 * so each mode tracks its own unlocked level + boss progress independently.
 */
export function strengthKey(workout: StrengthWorkout, mode?: "hold" | "pushup"): string {
  if (workout === "handstand") return mode === "pushup" ? "handstand_pushup" : "handstand_hold";
  return workout;
}

export interface State {
  level: number;
  chalk: number;
  totalChalkEarned: number;
  gender: Gender;
  owned: string[];        // item ids
  equipped: Equipped;
  pendingConsumable: string | null; // item id
  badges: string[];       // badge ids
  /** Badge ids for which the +50 chalk reward has already been granted. */
  badgeChalkClaimedFor: string[];
  bosses: Boss[];
  logs: BoulderLog[];
  /** Strength training sessions (separate from boulder logs). */
  strengthSessions: StrengthSession[];
  /** Per-workout chosen difficulty level (set first time the user logs that workout). */
  /** Keyed by `strengthKey(workout, mode)` — for handstand this splits hold vs pushup. */
  strengthLevels: Record<string, number>;
  /** Cumulative reps logged toward the next strength-boss defeat, keyed like `strengthLevels`. */
  strengthBossProgress?: Record<string, number>;
  /** Personal record (best seconds held) for hold-style sets, keyed `${strengthKey}:${level}`. */
  strengthHoldRecords?: Record<string, number>;
  stats: { totalLogs: number; totalSends: number; totalFlashes: number; bossesSent: number; };
  ignoreLevelReq?: boolean;
  /** ISO timestamp when the user completed first-time onboarding. */
  onboardedAt?: string | null;
  /** ISO date (YYYY-MM-DD) of the most recent daily-login chalk grant. */
  lastDailyLoginAt?: string | null;
  /** All YYYY-MM-DD dates the user claimed the daily-login chalk. Counts toward streak. */
  loginDays?: string[];
  /** Active temporary buffs (chalk/crit/cap %). Pruned lazily as they expire. */
  activeBuffs?: import("./streak").ActiveBuff[];
  /** Streak-milestone day numbers (14/21/30/…) already awarded. */
  streakMilestonesAwarded?: number[];
}

const STORAGE_KEY = "climbquest:v1";

const initialState = (): State => ({
  level: 1,
  chalk: 0,
  totalChalkEarned: 0,
  gender: "male",
  owned: [],
  equipped: {},
  pendingConsumable: null,
  badges: [],
  badgeChalkClaimedFor: [],
  bosses: [],
  logs: [],
  strengthSessions: [],
  strengthLevels: {},
  strengthBossProgress: {},
  strengthHoldRecords: {},
  stats: { totalLogs: 0, totalSends: 0, totalFlashes: 0, bossesSent: 0 },
  ignoreLevelReq: false,
  onboardedAt: null,
  lastDailyLoginAt: null,
  loginDays: [],
  activeBuffs: [],
  streakMilestonesAwarded: [],
});

function spawnBoss(t: BossTemplate): Boss {
  return {
    id: t.id + "-" + Math.random().toString(36).slice(2,7),
    name: t.name,
    grade: t.grade,
    styles: [t.style],
    style: t.style,
    difficulty: t.difficulty,
    emoji: t.emoji,
    flavor: t.flavor,
    attempts: [],
    highPoint: 0,
    sent: false,
    createdAt: new Date().toISOString(),
  };
}

// ----- Store -----
let state: State = load();
const listeners = new Set<() => void>();

const INVENTORY_RESET_KEY = "climbquest:inventoryReset:v2";
function load(): State {
  if (typeof window === "undefined") return initialState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState();
    const parsed = JSON.parse(raw);
    const merged: State = { ...initialState(), ...parsed };
    // Inventory wipe: no default items.
    if (!localStorage.getItem(INVENTORY_RESET_KEY)) {
      merged.owned = [];
      merged.equipped = {};
      merged.pendingConsumable = null;
      localStorage.setItem(INVENTORY_RESET_KEY, "1");
    }
    if ((merged.gender as string) === "neutral") merged.gender = "male";
    // Migrate legacy handstand_pushup sessions into handstand workout (mode=pushup).
    // Tag legacy handstand sessions (which stored seconds-bucket in reps) as mode=hold.
    if (Array.isArray(merged.strengthSessions)) {
      merged.strengthSessions = merged.strengthSessions.map(ss => {
        const w = (ss.workout as string) === "handstand_pushup" ? "handstand" : ss.workout;
        if (w !== "handstand") return ss;
        const mode: "hold" | "pushup" = (ss.workout as string) === "handstand_pushup" ? "pushup" : "hold";
        return {
          ...ss,
          workout: "handstand",
          sets: (ss.sets ?? []).map(st => ({ ...st, mode: st.mode ?? mode })),
        };
      });
    }
    // Migrate legacy handstand-hold bucket idx (1..4) to representative seconds.
    if (Array.isArray(merged.strengthSessions)) {
      const BUCKET_SECONDS: Record<number, number> = { 1: 10, 2: 20, 3: 45, 4: 75 };
      merged.strengthSessions = merged.strengthSessions.map(ss => {
        if (ss.workout !== "handstand") return ss;
        const sets = (ss.sets ?? []).map(st => {
          if (st.mode === "hold" && st.reps >= 1 && st.reps <= 4) {
            return { ...st, reps: BUCKET_SECONDS[st.reps] ?? st.reps };
          }
          return st;
        });
        const totalReps = sets.reduce((a, b) => a + (b.reps || 0), 0);
        return { ...ss, sets, totalReps };
      });
    }
    // Move handstand_pushup unlocked level into handstand if higher.
    if (merged.strengthLevels && (merged.strengthLevels as Record<string, number>).handstand_pushup !== undefined) {
      // legacy: pre-split handstand_pushup key already exists as its own; nothing to merge.
    }
    // Split combined "handstand" key into separate hold/pushup keys.
    if (merged.strengthLevels && (merged.strengthLevels as Record<string, number>).handstand !== undefined) {
      const lv = (merged.strengthLevels as Record<string, number>).handstand ?? 0;
      const sl = merged.strengthLevels as Record<string, number>;
      sl.handstand_hold = Math.max(sl.handstand_hold ?? 0, lv);
      sl.handstand_pushup = Math.max(sl.handstand_pushup ?? 0, lv);
      delete sl.handstand;
    }
    if (merged.strengthBossProgress && (merged.strengthBossProgress as Record<string, number>).handstand !== undefined) {
      const pg = (merged.strengthBossProgress as Record<string, number>).handstand ?? 0;
      const bp = merged.strengthBossProgress as Record<string, number>;
      bp.handstand_hold = Math.max(bp.handstand_hold ?? 0, pg);
      bp.handstand_pushup = Math.max(bp.handstand_pushup ?? 0, pg);
      delete bp.handstand;
    }
    // Migrate / clean up legacy bosses: strip template-spawned bosses (no createdAt),
    // backfill `styles` from legacy `style` for any user-saved boss.
    if (Array.isArray(merged.bosses)) {
      merged.bosses = merged.bosses
        .filter(b => b && (b.createdAt || b.sent || b.defeated))
        .map(b => ({
          ...b,
          createdAt: b.createdAt ?? new Date().toISOString(),
          styles: (b.styles && b.styles.length) ? b.styles : (b.style ? [b.style] : []),
        }));
    }
    return merged;
  } catch { return initialState(); }
}
function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  remoteSave?.(state);
}
function set(updater: (s: State) => State) {
  state = updater(state);
  persist();
  listeners.forEach(l => l());
}

let remoteSave: ((s: State) => void) | null = null;
export function bindGameRemoteSync(saver: ((s: State) => void) | null) {
  remoteSave = saver;
  if (!saver) {
    // Unbinding (e.g. sign-out): reset hydration so we don't flash onboarding
    // for the next session before its data loads.
    remoteHydrated = false;
    hydrationListeners.forEach(l => l());
  }
}
export function getGameStateSnapshot(): State { return state; }
/** Credit raw chalk to the player and persist (also syncs remotely). */
export function awardChalk(amount: number) {
  if (!amount) return;
  set(s => ({ ...s, chalk: s.chalk + amount, totalChalkEarned: s.totalChalkEarned + amount }));
}
export function replaceGameState(next: State) {
  state = { ...initialState(), ...next };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  listeners.forEach(l => l());
  if (!remoteHydrated) {
    remoteHydrated = true;
    hydrationListeners.forEach(l => l());
  }
}

let remoteHydrated = false;
const hydrationListeners = new Set<() => void>();
export function useRemoteHydrated(): boolean {
  return useSyncExternalStore(
    (cb) => { hydrationListeners.add(cb); return () => hydrationListeners.delete(cb); },
    () => remoteHydrated,
    () => false,
  );
}

export function useGame(): State {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => state,
    () => state,
  );
}

// ----- Selectors -----
export function nextLevel(s: State) {
  const base = LEVELS.find(l => l.level === s.level + 1);
  if (!base) return undefined;
  return resolvedLevel(base.level, s.gender);
}
export function currentLevel(s: State) {
  const base = LEVELS.find(l => l.level === s.level)!;
  return resolvedLevel(base.level, s.gender);
}
export function activeBoss(s: State) {
  return s.bosses.find(b => b.active && !b.sent) ?? s.bosses.find(b => !b.sent);
}

/** Highest difficulty (1–10) of any boss the player has SENT. Default 1. */
export function playerCeiling(s: State): number {
  let max = 1;
  for (const b of s.bosses) if (b.sent && (b.difficulty ?? 0) > max) max = b.difficulty ?? max;
  return max;
}

/** Effective shop price: applies the equipped discount item (no stacking). */
export function effectivePrice(s: State, listPrice: number): number {
  let bestMult = 1;
  for (const slotKey of Object.keys(s.equipped) as (keyof Equipped)[]) {
    const id = s.equipped[slotKey]; if (!id) continue;
    const item = getItem(id); if (!item?.priceMult) continue;
    if (item.priceMult < bestMult) bestMult = item.priceMult;
  }
  return Math.max(0, Math.round(listPrice * bestMult));
}

/** Same shape as gym difficulty curve, but operating on boss.difficulty (1–10). */
function bossDifficultyMultiplier(climbDiff: number, ceilingDiff: number): number {
  const ratio = climbDiff / Math.max(1, ceilingDiff);
  if (ratio <= 0.3) return 0.25;
  if (ratio <= 0.6) return 0.55;
  if (ratio <= 0.85) return 0.85;
  if (ratio <= 1.0) return 1.0;
  if (ratio <= 1.15) return 1.25;
  return 1.5;
}

// ----- Chalk computation -----
export interface ChalkBreakdown {
  base: number;
  bonuses: { source: string; amount: number }[];
  total: number;
  capInfo?: { cap: number; used: number; reduced: boolean };
}
/** Per-activity reward grows with player level: +15% per level above 1. */
export function activityLevelMult(level: number): number {
  return 1 + Math.max(0, level - 1) * 0.15;
}
/** Level-scaled, admin-tunable per-activity reward. */
export function scaledActivityReward(activity: ActivityType, level: number = state.level): number {
  return Math.max(1, Math.round(getActivityReward(activity) * activityLevelMult(level)));
}

export function computeChalk(
  activity: ActivityType,
  styles: Style[],
  sent = false,
  flashed = false,
  difficultyMult = 1,
  dateISO?: string,
  repeat = false,
): ChalkBreakdown {
  const baseRaw = scaledActivityReward(activity);
  const base = Math.max(1, Math.round(baseRaw * difficultyMult));
  const bonuses: { source: string; amount: number }[] = [];
  let running = base;
  if (difficultyMult !== 1) {
    const pct = Math.round((difficultyMult - 1) * 100);
    bonuses.push({
      source: difficultyMult > 1 ? `Difficulty (+${pct}%)` : `Below your level (${pct}%)`,
      amount: 0, // already baked into base
    });
  }

  const sentLike = sent || repeat;

  // Send flat bonus first (additive, not stacked %)
  if (sentLike && (activity === "warmup_boulder" || activity === "boulder" || activity === "hard_boulder" || activity === "project_boulder")) {
    const amt = Math.round(scaledActivityReward("boulder_send") * difficultyMult);
    bonuses.push({ source: "Send", amount: amt });
    running += amt;
  }

  // Flash: +50% on the base chalk
  if (flashed && (activity === "warmup_boulder" || activity === "boulder" || activity === "hard_boulder" || activity === "project_boulder")) {
    const amt = Math.round(base * 0.5);
    bonuses.push({ source: "Flash (+50%)", amount: amt });
    running += amt;
  }

  // Equipped percentage bonuses — stack multiplicatively on running subtotal
  const eq = state.equipped;
  for (const slotKey of Object.keys(eq) as (keyof Equipped)[]) {
    const id = eq[slotKey]; if (!id) continue;
    const item = getItem(id); if (!item?.bonus) continue;
    const b = item.bonus;
    let applies = false;
    if (b.appliesTo === "all") applies = true;
    else if (b.appliesTo && b.appliesTo.includes(activity)) applies = true;
    if (b.styleMatch && styles.some(s => b.styleMatch!.includes(s))) applies = true;
    if (applies && b.mult > 0) {
      const amt = Math.round(running * b.mult);
      bonuses.push({ source: item.name, amount: amt });
      running += amt;
    }
  }

  // Boss bonus — extra % on boss attempts/sends, summed across equipped items
  if (activity === "boss_attempt" || activity === "boss_send") {
    let bossPct = 0;
    for (const slotKey of Object.keys(eq) as (keyof Equipped)[]) {
      const id = eq[slotKey]; if (!id) continue;
      const item = getItem(id);
      if (item?.bossBonusPct) bossPct += item.bossBonusPct;
    }
    if (bossPct > 0) {
      const amt = Math.round(running * (bossPct / 100));
      bonuses.push({ source: `Boss bonus (+${bossPct}%)`, amount: amt });
      running += amt;
    }
  }

  // Consumable — stacked next
  if (state.pendingConsumable) {
    const item = getItem(state.pendingConsumable);
    if (item?.consumableBonus) {
      const amt = Math.round(running * item.consumableBonus);
      bonuses.push({ source: item.name + " (consumed)", amount: amt });
      running += amt;
    }
  }

  // ----- Daily streak day-bonus (1..7-day cycle) -----
  const streak = currentStreak(state);
  const streakPct = streakDayBonusPct(streak);
  if (streakPct > 0 && running > 0) {
    const amt = Math.round(running * streakPct / 100);
    bonuses.push({ source: `Streak Day ${cycleDay(streak)} (+${streakPct}%)`, amount: amt });
    running += amt;
  }

  // ----- Active chalk buffs (post-streak / milestone rewards) -----
  const chalkBuff = activeChalkBuffPct(state);
  if (chalkBuff > 0 && running > 0) {
    const amt = Math.round(running * chalkBuff / 100);
    bonuses.push({ source: `Streak buff (+${chalkBuff}%)`, amount: amt });
    running += amt;
  }

  // ----- Strength tier (rolling 7-day) chalk bonus -----
  const stTier = tierFor(state.strengthSessions ?? []).tier;
  const stPct = tierChalkPct(stTier);
  if (stPct > 0 && running > 0) {
    const amt = Math.round(running * stPct / 100);
    bonuses.push({ source: `Strength ${TIER_LABEL[stTier]} (+${stPct}%)`, amount: amt });
    running += amt;
  }

  // Repeat — done it before, half the chalk.
  if (repeat) {
    const reduced = Math.round(running * 0.5);
    bonuses.push({ source: "Repeat (−50%)", amount: reduced - running });
    running = reduced;
  }

  // Crit — final stage. Combine probabilities across equipped items: 1 - Π(1-p).
  let critProb = 0;
  for (const slotKey of Object.keys(eq) as (keyof Equipped)[]) {
    const id = eq[slotKey]; if (!id) continue;
    const item = getItem(id);
    if (item?.critChancePct) {
      const p = Math.max(0, Math.min(100, item.critChancePct)) / 100;
      critProb = 1 - (1 - critProb) * (1 - p);
    }
  }
  // Active crit buff folds into the combined crit probability.
  const critBuff = activeCritBuffPct(state);
  if (critBuff > 0) {
    critProb = 1 - (1 - critProb) * (1 - Math.min(100, critBuff) / 100);
  }
  const stCrit = tierCritPct(stTier);
  if (stCrit > 0) {
    critProb = 1 - (1 - critProb) * (1 - Math.min(100, stCrit) / 100);
  }
  if (critProb > 0 && Math.random() < critProb) {
    bonuses.push({ source: `Crit! ×2 (${Math.round(critProb * 100)}%)`, amount: running });
    running *= 2;
  }

  // Daily cap — soft, with diminishing returns. Applied last. Active cap-buff scales the cap up.
  const dateForCap = dateISO ?? new Date().toISOString();
  const cfg = getDailyCapConfig();
  if (cfg.enabled) {
    const used = chalkUsedOnDate(state, dateForCap);
    const capBase = computeDailyCap(state.level, cfg);
    const capBuff = activeCapBuffPct(state);
    const cap = Math.round(capBase * (1 + capBuff / 100));
    const cappedAmount = applyDailyCap(running, used, cap, cfg);
    if (cappedAmount.reduced) {
      bonuses.push({
        source: cappedAmount.label ?? `Daily cap`,
        amount: cappedAmount.granted - running, // negative
      });
      running = cappedAmount.granted;
    }
    return { base, bonuses, total: running, capInfo: { cap, used, reduced: cappedAmount.reduced } };
  }

  return { base, bonuses, total: running };
}

/** Apply equipped board-bonus % to an existing breakdown. Used for board sessions
 *  since they bypass the boulder activity path in `computeChalk`. */
export function applyBoardBonus(b: ChalkBreakdown): ChalkBreakdown {
  const eq = state.equipped;
  let boardPct = 0;
  for (const slotKey of Object.keys(eq) as (keyof Equipped)[]) {
    const id = eq[slotKey]; if (!id) continue;
    const item = getItem(id);
    if (item?.boardBonusPct) boardPct += item.boardBonusPct;
  }
  if (boardPct > 0) {
    const amt = Math.round(b.total * (boardPct / 100));
    b.bonuses.push({ source: `Board bonus (+${boardPct}%)`, amount: amt });
    b.total += amt;
  }
  return b;
}

// ----- Actions -----
export interface LogInput {
  activity: ActivityType;
  date?: string;
  duration?: number;
  location?: string;
  grade?: string;
  gradeMax?: string;
  styles: Style[];
  sent?: boolean;
  problemsTried?: number;
  sends?: number;
  hardestSend?: string;
  notes?: string;
  isBoss?: boolean;
  attemptType?: AttemptType;
  holdColorId?: string;
  gymId?: string;
  bossId?: string;
  chalkMultiplier?: number;
  /** Pre-computed difficulty multiplier (climb grade vs player ceiling). Default 1. */
  difficultyMult?: number;
}

/** Apply streak-progression rewards (post-cycle buffs + 14/21/30 milestones) to `next`. */
function applyStreakProgress(prev: State, next: State): State {
  const cfg = getStreakConfig();
  if (!cfg.enabled) return next;
  const prevStreak = currentStreak(prev);
  const nextStreak = currentStreak(next);
  if (nextStreak <= prevStreak) {
    // Still prune expired buffs so the state stays tidy.
    return { ...next, activeBuffs: cleanExpiredBuffs(next.activeBuffs) };
  }
  const dailyCap = computeDailyCap(next.level, getDailyCapConfig());
  const result = streakRewardsFor(prevStreak, nextStreak, next, dailyCap, cfg);
  let out: State = withBuffs(next, result.addedBuffs);
  if (result.chalkCache > 0) {
    out = { ...out, chalk: out.chalk + result.chalkCache, totalChalkEarned: out.totalChalkEarned + result.chalkCache };
  }
  if (result.awardedMilestoneDays.length) {
    out = { ...out, streakMilestonesAwarded: [...(out.streakMilestonesAwarded ?? []), ...result.awardedMilestoneDays] };
  }
  if (result.bannerLabel) emitStreakEvent(result.bannerLabel);
  return out;
}

export function logBoulder(input: LogInput) {
  const raw = computeChalk(input.activity, input.styles, input.sent, input.attemptType === "flash", input.difficultyMult ?? 1, input.date, input.attemptType === "repeat");
  const mult = input.chalkMultiplier ?? 1;
  const breakdown = mult === 1 ? raw : {
    base: raw.base,
    bonuses: raw.bonuses,
    total: Math.round(raw.total * mult),
  };
  const log: BoulderLog = {
    id: crypto.randomUUID(),
    date: input.date ?? new Date().toISOString(),
    activity: input.activity,
    duration: input.duration,
    location: input.location,
    grade: input.grade,
    gradeMax: input.gradeMax,
    styles: input.styles,
    problemsTried: input.problemsTried,
    sends: input.sends,
    hardestSend: input.hardestSend,
    notes: input.notes,
    chalkBase: breakdown.base,
    chalkBonus: breakdown.total - breakdown.base,
    chalkTotal: breakdown.total,
    isBoss: input.isBoss,
    attemptType: input.attemptType,
    holdColorId: input.holdColorId,
    gymId: input.gymId,
    bossId: input.bossId,
  };

  set(s => {
    const newBadges = computeNewBadges(s, log);
    const next: State = {
      ...s,
      chalk: s.chalk + log.chalkTotal,
      totalChalkEarned: s.totalChalkEarned + log.chalkTotal,
      logs: [log, ...s.logs].slice(0, 200),
      pendingConsumable: null,
      stats: {
        ...s.stats,
        totalLogs: s.stats.totalLogs + 1,
        totalSends: s.stats.totalSends + (input.sent || input.attemptType === "flash" || input.attemptType === "send" ? 1 : 0),
        totalFlashes: s.stats.totalFlashes + (input.attemptType === "flash" ? 1 : 0),
        bossesSent: s.stats.bossesSent + (input.isBoss && (input.attemptType === "flash" || input.attemptType === "send") ? 1 : 0),
      },
    };
    return applyStreakProgress(s, applyBadges(next, newBadges));
  });
  return { log, breakdown, newBadges: computeNewBadgesAfter() };
}

export function deleteLog(id: string) {
  set(s => {
    const log = s.logs.find(l => l.id === id);
    if (!log) return s;
    const sentLike = log.attemptType === "flash" || log.attemptType === "send";
    return {
      ...s,
      logs: s.logs.filter(l => l.id !== id),
      chalk: Math.max(0, s.chalk - log.chalkTotal),
      totalChalkEarned: Math.max(0, s.totalChalkEarned - log.chalkTotal),
      stats: {
        ...s.stats,
        totalLogs: Math.max(0, s.stats.totalLogs - 1),
        totalSends: Math.max(0, s.stats.totalSends - (sentLike ? 1 : 0)),
        totalFlashes: Math.max(0, s.stats.totalFlashes - (log.attemptType === "flash" ? 1 : 0)),
        bossesSent: Math.max(0, s.stats.bossesSent - (log.isBoss && sentLike ? 1 : 0)),
      },
    };
  });
}

// ----- Strength sessions -----
export interface StrengthInput {
  workout: StrengthWorkout;
  level: number;
  sets: StrengthSet[];
  date?: string;
  /** When true, this session is a successful strength-boss send (level-up). */
  bossSend?: boolean;
  /** When provided, skips the per-rep base calculation and uses this as the base chalk (used by hold tier rewards). */
  baseOverride?: number;
}
export function logStrength(input: StrengthInput): { session: StrengthSession; chalk: number; breakdown: ChalkBreakdown } {
  const totalReps = input.sets.reduce((a, b) => a + (b.reps || 0), 0);
  // For handstand, derive mode from the first set so hold vs pushup track separately.
  const sessionMode: "hold" | "pushup" | undefined =
    input.workout === "handstand" ? (input.sets[0]?.mode ?? "hold") : undefined;
  const key = strengthKey(input.workout, sessionMode);
  const maxUnlocked = state.strengthLevels?.[key] ?? 0;
  const base = input.baseOverride !== undefined
    ? Math.max(0, Math.round(input.baseOverride))
    : Math.max(1, Math.round(
        input.sets.reduce((sum, st) => {
          const lv = st.level ?? input.level;
          return sum + (st.reps || 0) * strengthRepChalk(lv, maxUnlocked);
        }, 0)
      ));
  const dateISO = input.date ?? new Date().toISOString();

  // ----- Apply equipped bonuses (mirrors computeChalk for boulders) -----
  const bonuses: { source: string; amount: number }[] = [];
  let running = base;
  const eq = state.equipped;
  for (const slotKey of Object.keys(eq) as (keyof Equipped)[]) {
    const id = eq[slotKey]; if (!id) continue;
    const item = getItem(id); if (!item?.bonus) continue;
    const b = item.bonus;
    // Strength sessions count as "all"-applies effects only — they aren't bound to ActivityType.
    if (b.appliesTo === "all" && b.mult > 0) {
      const amt = Math.round(running * b.mult);
      bonuses.push({ source: item.name, amount: amt });
      running += amt;
    }
  }
  // Strength-boss send: flat boss-bonus + strength_boss_send flat reward.
  if (input.bossSend) {
    let bossPct = 0;
    for (const slotKey of Object.keys(eq) as (keyof Equipped)[]) {
      const id = eq[slotKey]; if (!id) continue;
      const item = getItem(id);
      if (item?.bossBonusPct) bossPct += item.bossBonusPct;
    }
    if (bossPct > 0) {
      const amt = Math.round(running * (bossPct / 100));
      bonuses.push({ source: `Boss bonus (+${bossPct}%)`, amount: amt });
      running += amt;
    }
    const flat = scaledActivityReward("strength_boss_send");
    if (flat > 0) {
      bonuses.push({ source: "Strength boss send", amount: flat });
      running += flat;
    }
  }
  // Consumable
  if (state.pendingConsumable) {
    const item = getItem(state.pendingConsumable);
    if (item?.consumableBonus) {
      const amt = Math.round(running * item.consumableBonus);
      bonuses.push({ source: item.name + " (consumed)", amount: amt });
      running += amt;
    }
  }
  // ----- Daily streak day-bonus -----
  const streak = currentStreak(state);
  const streakPct = streakDayBonusPct(streak);
  if (streakPct > 0 && running > 0) {
    const amt = Math.round(running * streakPct / 100);
    bonuses.push({ source: `Streak Day ${cycleDay(streak)} (+${streakPct}%)`, amount: amt });
    running += amt;
  }
  // ----- Active chalk buffs -----
  const chalkBuff = activeChalkBuffPct(state);
  if (chalkBuff > 0 && running > 0) {
    const amt = Math.round(running * chalkBuff / 100);
    bonuses.push({ source: `Streak buff (+${chalkBuff}%)`, amount: amt });
    running += amt;
  }
  // ----- Strength tier (rolling 7-day) chalk bonus -----
  // Include the session-in-progress so the bonus reflects today's qualifier.
  const sessionsForTier = [
    { id: "_preview", date: dateISO, workout: input.workout, level: input.level, sets: input.sets, totalReps } as StrengthSession,
    ...(state.strengthSessions ?? []),
  ];
  const stTier = tierFor(sessionsForTier).tier;
  const stPct = tierChalkPct(stTier);
  if (stPct > 0 && running > 0) {
    const amt = Math.round(running * stPct / 100);
    bonuses.push({ source: `Strength ${TIER_LABEL[stTier]} (+${stPct}%)`, amount: amt });
    running += amt;
  }
  // Crit (with active crit buff folded in)
  let critProb = 0;
  for (const slotKey of Object.keys(eq) as (keyof Equipped)[]) {
    const id = eq[slotKey]; if (!id) continue;
    const item = getItem(id);
    if (item?.critChancePct) {
      const p = Math.max(0, Math.min(100, item.critChancePct)) / 100;
      critProb = 1 - (1 - critProb) * (1 - p);
    }
  }
  const critBuff = activeCritBuffPct(state);
  if (critBuff > 0) {
    critProb = 1 - (1 - critProb) * (1 - Math.min(100, critBuff) / 100);
  }
  const stCrit = tierCritPct(stTier);
  if (stCrit > 0) {
    critProb = 1 - (1 - critProb) * (1 - Math.min(100, stCrit) / 100);
  }
  if (critProb > 0 && Math.random() < critProb) {
    bonuses.push({ source: `Crit! ×2 (${Math.round(critProb * 100)}%)`, amount: running });
    running *= 2;
  }
  // Daily cap (cap-buff scales the cap up)
  const cfg = getDailyCapConfig();
  let capInfo: ChalkBreakdown["capInfo"] | undefined;
  if (cfg.enabled) {
    const used = chalkUsedOnDate(state, dateISO);
    const capBase = computeDailyCap(state.level, cfg);
    const capBuff = activeCapBuffPct(state);
    const cap = Math.round(capBase * (1 + capBuff / 100));
    const capped = applyDailyCap(running, used, cap, cfg);
    if (capped.reduced) {
      bonuses.push({ source: capped.label ?? "Daily cap", amount: capped.granted - running });
      running = capped.granted;
    }
    capInfo = { cap, used, reduced: capped.reduced };
  }

  const chalk = Math.max(0, running);
  const breakdown: ChalkBreakdown = { base, bonuses, total: chalk, capInfo };

  const session: StrengthSession = {
    id: crypto.randomUUID(),
    date: dateISO,
    workout: input.workout,
    level: input.level,
    sets: input.sets,
    totalReps,
    chalkTotal: chalk,
    bossSend: input.bossSend,
  };
  set(s => {
    const prevMax = s.strengthLevels?.[key] ?? 0;
    const nextMax = input.bossSend ? Math.max(prevMax, input.level) : Math.max(prevMax, 1);
    const next: State = {
      ...s,
      chalk: s.chalk + chalk,
      totalChalkEarned: s.totalChalkEarned + chalk,
      strengthSessions: [session, ...(s.strengthSessions ?? [])].slice(0, 500),
      strengthLevels: { ...(s.strengthLevels ?? {}), [key]: nextMax },
      pendingConsumable: null,
    };
    const add: string[] = [];
    if (input.bossSend) add.push("first_strength_boss");
    if (Object.values(next.strengthLevels ?? {}).some(v => (v ?? 0) >= 3)) add.push("strength_tier_3");
    return applyStreakProgress(s, applyBadges(next, add));
  });
  return { session, chalk, breakdown };
}

// ----- Hangboard sessions -----
/** Extra metadata appended to a hangboard StrengthSession. */
export interface HangboardMeta {
  workoutId: string;
  workoutName: string;
  holds: { holdId: string; seconds: number }[];
}
export interface HangboardInput {
  workoutId: string;
  workoutName: string;
  totalHangSeconds: number;
  holds: { holdId: string; seconds: number }[];
  date?: string;
}
/**
 * Persist a completed hangboard session. We write it into `strengthSessions`
 * shaped like a hold-style strength session (sets = [{reps: seconds, mode:"hold"}])
 * so the existing 7-day rolling holds tier picks it up automatically. The
 * `hangboard` field tags it so the dashboard chart can filter it separately.
 */
export function logHangboardSession(input: HangboardInput): { chalk: number; session: StrengthSession } {
  const dateISO = input.date ?? new Date().toISOString();
  const seconds = Math.max(0, Math.round(input.totalHangSeconds));
  const base = Math.max(0, Math.round(seconds * getActivityReward("strength_rep") * activityLevelMult(state.level)));
  const session: StrengthSession & { hangboard?: HangboardMeta } = {
    id: crypto.randomUUID(),
    date: dateISO,
    workout: "hangboard" as unknown as StrengthWorkout,
    level: 1,
    sets: [{ reps: seconds, mode: "hold" }],
    totalReps: seconds,
    chalkTotal: base,
    hangboard: {
      workoutId: input.workoutId,
      workoutName: input.workoutName,
      holds: input.holds,
    },
  };
  set(s => ({
    ...s,
    chalk: s.chalk + base,
    totalChalkEarned: s.totalChalkEarned + base,
    strengthSessions: [session, ...(s.strengthSessions ?? [])].slice(0, 500),
  }));
  return { chalk: base, session };
}



// ----- Hold-style strength (timer-based) -----
function holdRecordKey(workout: StrengthWorkout, level: number, mode?: "hold" | "pushup"): string {
  return `${strengthKey(workout, mode)}:${level}`;
}
export function getHoldRecord(workout: StrengthWorkout, level: number, mode?: "hold" | "pushup"): number {
  return state.strengthHoldRecords?.[holdRecordKey(workout, level, mode)] ?? 0;
}

export interface HoldInput {
  workout: StrengthWorkout;
  level: number;
  seconds: number;
  mode?: "hold" | "pushup";
  date?: string;
  /** When true, treat as a successful hold boss send (unlocks next level). */
  bossSend?: boolean;
}
export function logStrengthHold(input: HoldInput): {
  session: StrengthSession;
  chalk: number;
  breakdown: ChalkBreakdown;
  prevRecord: number;
  newRecord: number;
  isNewRecord: boolean;
  isFirstEver: boolean;
} {
  const seconds = Math.max(0, Math.round(input.seconds));
  const mode = input.mode ?? "hold";
  const prevRecord = getHoldRecord(input.workout, input.level, mode);
  const isFirstEver = prevRecord <= 0;
  const isNewRecord = !isFirstEver && seconds > prevRecord;

  let baseOverride: number;
  if (input.bossSend) {
    baseOverride = scaledActivityReward("strength_boss_send");
  } else if (isFirstEver) {
    baseOverride = HOLD_REWARDS.FIRST_EVER;
  } else if (seconds > prevRecord) {
    baseOverride = HOLD_REWARDS.PR_BEAT;
  } else if (seconds >= prevRecord * 0.5) {
    baseOverride = HOLD_REWARDS.TIER_50;
  } else if (seconds >= prevRecord * 0.1) {
    baseOverride = HOLD_REWARDS.TIER_10;
  } else {
    baseOverride = 0;
  }

  const result = logStrength({
    workout: input.workout,
    level: input.level,
    sets: [{ reps: seconds, level: input.level, mode }],
    date: input.date,
    bossSend: input.bossSend,
    baseOverride,
  });

  const newRecord = Math.max(prevRecord, seconds);
  if (newRecord > prevRecord) {
    set(s => ({
      ...s,
      strengthHoldRecords: {
        ...(s.strengthHoldRecords ?? {}),
        [holdRecordKey(input.workout, input.level, mode)]: newRecord,
      },
    }));
  }

  return { ...result, prevRecord, newRecord, isNewRecord: isNewRecord || isFirstEver, isFirstEver };
}
export function deleteStrengthSession(id: string) {
  set(s => {
    const sess = (s.strengthSessions ?? []).find(x => x.id === id);
    const refund = sess?.chalkTotal ?? 0;
    return {
      ...s,
      strengthSessions: (s.strengthSessions ?? []).filter(x => x.id !== id),
      chalk: Math.max(0, s.chalk - refund),
      totalChalkEarned: Math.max(0, s.totalChalkEarned - refund),
    };
  });
}

/** Manually set the user's max-unlocked strength level (used internally / by admin). */
export function setStrengthLevel(workout: StrengthWorkout, level: number, mode?: "hold" | "pushup") {
  const key = strengthKey(workout, mode);
  set(s => ({ ...s, strengthLevels: { ...(s.strengthLevels ?? {}), [key]: Math.max(1, level) } }));
}

/** Reset strength-level selections so the first-time picker shows again. */
export function resetStrengthLevels() {
  set(s => ({ ...s, strengthLevels: {}, strengthBossProgress: {} }));
}

/** Cumulative reps logged toward the next strength-boss defeat for `workout`. */
export function getStrengthBossProgress(workout: StrengthWorkout, mode?: "hold" | "pushup"): number {
  return state.strengthBossProgress?.[strengthKey(workout, mode)] ?? 0;
}

/**
 * Log a single boss-attempt rep. Each call adds 1 rep toward the cumulative
 * boss target (10). When cumulative reaches 10, mark a successful boss send,
 * unlock the next level, and reset progress.
 */
export function logStrengthBossRep(workout: StrengthWorkout, attempts: number = 1, mode?: "hold" | "pushup"): {
  chalk: number;
  defeated: boolean;
  progress: number;
  target: number;
  unlockedLevel?: number;
} {
  const key = strengthKey(workout, mode);
  const target = strengthBossTarget(workout);
  const prevMax = state.strengthLevels?.[key] ?? 0;
  const targetLevel = Math.min(maxStrengthLevel(workout), Math.max(1, prevMax + 1));
  const prevProgress = state.strengthBossProgress?.[key] ?? 0;
  const remaining = Math.max(0, target - prevProgress);
  const reps = Math.max(1, Math.min(remaining > 0 ? remaining : target, Math.round(attempts)));
  const nextProgress = prevProgress + reps;
  const defeated = nextProgress >= target;

  const { chalk } = logStrength({
    workout,
    level: targetLevel,
    sets: [{ reps, ...(mode ? { mode } : {}) }],
    bossSend: defeated,
  });

  set(s => ({
    ...s,
    strengthBossProgress: {
      ...(s.strengthBossProgress ?? {}),
      [key]: defeated ? 0 : nextProgress,
    },
  }));

  return {
    chalk,
    defeated,
    progress: defeated ? 0 : nextProgress,
    target,
    unlockedLevel: defeated ? targetLevel : undefined,
  };
}

export function maxStrengthLevel(workout: StrengthWorkout): number {
  if (workout === "pullup") return 6;
  return 5;
}

export function updateLog(id: string, input: LogInput) {
  const raw = computeChalk(input.activity, input.styles, input.sent, input.attemptType === "flash", input.difficultyMult ?? 1, input.date, input.attemptType === "repeat");
  const mult = input.chalkMultiplier ?? 1;
  const breakdown = mult === 1 ? raw : {
    base: raw.base,
    bonuses: raw.bonuses,
    total: Math.round(raw.total * mult),
  };
  set(s => {
    const old = s.logs.find(l => l.id === id);
    if (!old) return s;
    const updated: BoulderLog = {
      ...old,
      date: input.date ?? old.date,
      activity: input.activity,
      duration: input.duration,
      location: input.location,
      grade: input.grade,
      gradeMax: input.gradeMax,
      styles: input.styles,
      problemsTried: input.problemsTried,
      sends: input.sends,
      hardestSend: input.hardestSend,
      notes: input.notes,
      chalkBase: breakdown.base,
      chalkBonus: breakdown.total - breakdown.base,
      chalkTotal: breakdown.total,
      isBoss: input.isBoss,
      attemptType: input.attemptType,
      holdColorId: input.holdColorId,
      gymId: input.gymId,
    };
    const chalkDelta = updated.chalkTotal - old.chalkTotal;
    const oldSent = old.attemptType === "flash" || old.attemptType === "send";
    const newSent = updated.attemptType === "flash" || updated.attemptType === "send";
    return {
      ...s,
      logs: s.logs.map(l => l.id === id ? updated : l),
      chalk: Math.max(0, s.chalk + chalkDelta),
      totalChalkEarned: Math.max(0, s.totalChalkEarned + Math.max(0, chalkDelta)),
      stats: {
        ...s.stats,
        totalSends: Math.max(0, s.stats.totalSends + ((newSent ? 1 : 0) - (oldSent ? 1 : 0))),
        totalFlashes: Math.max(0, s.stats.totalFlashes + ((updated.attemptType === "flash" ? 1 : 0) - (old.attemptType === "flash" ? 1 : 0))),
        bossesSent: Math.max(0, s.stats.bossesSent + ((updated.isBoss && newSent ? 1 : 0) - (old.isBoss && oldSent ? 1 : 0))),
      },
    };
  });
  return { breakdown };
}

let lastNewBadges: string[] = [];
function computeNewBadges(s: State, log: BoulderLog): string[] {
  const have = new Set(s.badges);
  const add: string[] = [];
  const stylesIn = new Set(log.styles);
  if (!have.has("first_send")) add.push("first_send");
  if (stylesIn.has("slab") && !have.has("slab_survivor")) add.push("slab_survivor");
  if (stylesIn.has("overhang") && !have.has("overhang_enjoyer")) add.push("overhang_enjoyer");
  const total = s.totalChalkEarned + log.chalkTotal;
  if (total >= 1000 && !have.has("chalk_monster")) add.push("chalk_monster");
  // crimp count
  const crimpCount = s.logs.filter(l => l.styles.includes("crimp")).length + (log.styles.includes("crimp") ? 1 : 0);
  if (crimpCount >= 5 && !have.has("tiny_crimp")) add.push("tiny_crimp");
  lastNewBadges = add;
  return add;
}
function computeNewBadgesAfter() { return lastNewBadges; }

export function levelUp(): { ok: boolean; reason?: string; unlocks?: string[] } {
  const next = nextLevel(state);
  if (!next) return { ok: false, reason: "Already max level" };
  if (state.chalk < next.cost) return { ok: false, reason: "Not enough Chalk" };
  set(s => {
    const lifted: State = { ...s, chalk: s.chalk - next.cost, level: next.level };
    return applyBadges(lifted, levelBadges(next.level));
  });
  return { ok: true, unlocks: next.unlocks };
}
function levelBadges(lvl: number): string[] {
  const out: string[] = [];
  if (lvl >= 6) out.push("dyno_unlocked");
  if (lvl >= 10) out.push("demigod_unlocked");
  return out;
}

export function buyItem(id: string): { ok: boolean; reason?: string } {
  const item = getItem(id);
  if (!item) return { ok: false, reason: "Unknown item" };
  // Level requirements removed — anyone with enough chalk can buy.
  if (!item.consumableBonus && state.owned.includes(id)) return { ok: false, reason: "Already owned" };
  const price = effectivePrice(state, item.price);
  if (state.chalk < price) return { ok: false, reason: "Not enough Chalk" };
  set(s => {
    const owned = item.consumableBonus ? s.owned : [...s.owned, id];
    const add: string[] = [];
    if (id === "crocs") add.push("crocs_equipped");
    if (item.group === "buddy") add.push("first_buddy");
    if (!item.consumableBonus) {
      if (owned.length >= 1) add.push("first_purchase");
      if (owned.length >= 5) add.push("five_purchases");
    }
    const next: State = { ...s, chalk: s.chalk - price, owned };
    return applyBadges(next, add);
  });
  return { ok: true };
}

export function equipItem(id: string): { ok: boolean; reason?: string } {
  const item = getItem(id); if (!item) return { ok: false, reason: "Unknown item" };
  if (item.consumableBonus) {
    set(s => ({ ...s, pendingConsumable: id }));
    return { ok: true };
  }
  const state = getGameStateSnapshot();
  if (item.group === "gear") {
    const max = gearSlotsUnlocked(state.level);
    const equippedGearSlots = GEAR_SLOTS.filter(sl => !!state.equipped[sl]);
    const alreadyInThisSlot = !!state.equipped[item.slot];
    if (!alreadyInThisSlot && equippedGearSlots.length >= max) {
      return { ok: false, reason: `No free gear slot — unlock more by leveling up (max ${max} at Lv ${state.level})` };
    }
  }
  set(s => {
    const next: State = { ...s, equipped: { ...s.equipped, [item.slot]: id } };
    const add = ["first_equip"];
    if (allRequiredSlotsEquipped(next)) add.push("all_slots_equipped");
    return applyBadges(next, add);
  });
  return { ok: true };
}

/** Slots a player at this level should have filled to count as fully kitted. */
function requiredEquipSlots(level: number): Slot[] {
  const out: Slot[] = ["shoes", "outfit", "bottoms", "hat"];
  for (const g of GEAR_SLOTS.slice(0, gearSlotsUnlocked(level))) out.push(g);
  if (level >= BUDDY_SLOT_UNLOCK_LEVEL) out.push("buddy");
  return out;
}
function allRequiredSlotsEquipped(s: State): boolean {
  return requiredEquipSlots(s.level).every(sl => !!s.equipped[sl]);
}
export function unequipSlot(slot: keyof Equipped) {
  set(s => { const eq = { ...s.equipped }; delete eq[slot]; return { ...s, equipped: eq }; });
}
export function removeOwnedItem(id: string) {
  set(s => {
    const eq = { ...s.equipped };
    for (const k of Object.keys(eq) as (keyof Equipped)[]) if (eq[k] === id) delete eq[k];
    return {
      ...s,
      owned: s.owned.filter(x => x !== id),
      equipped: eq,
      pendingConsumable: s.pendingConsumable === id ? null : s.pendingConsumable,
    };
  });
}
/** Sell an owned item for half its base price. Adds chalk WITHOUT counting toward totalChalkEarned. */
export function sellItem(id: string): { ok: boolean; refund?: number; reason?: string } {
  const item = getItem(id);
  if (!item) return { ok: false, reason: "Unknown item" };
  if (!state.owned.includes(id)) return { ok: false, reason: "Not owned" };
  const refund = Math.max(0, Math.floor((item.price ?? 0) / 2));
  set(s => {
    const eq = { ...s.equipped };
    for (const k of Object.keys(eq) as (keyof Equipped)[]) if (eq[k] === id) delete eq[k];
    return {
      ...s,
      owned: s.owned.filter(x => x !== id),
      equipped: eq,
      pendingConsumable: s.pendingConsumable === id ? null : s.pendingConsumable,
      chalk: s.chalk + refund,
    };
  });
  return { ok: true, refund };
}
export function setGender(g: Gender) { set(s => ({ ...s, gender: g })); }
export function completeOnboarding() {
  set(s => ({ ...s, onboardedAt: new Date().toISOString() }));
}
export function resetOnboarding() {
  set(s => ({ ...s, onboardedAt: null }));
}

/** Base "show up" chalk before level/streak multipliers. */
export const DAILY_LOGIN_REWARD = 50;
export const BASE_DAILY_LOGIN_REWARD = DAILY_LOGIN_REWARD;

/** Dynamic daily-login reward = base × level multiplier × (1 + streak day bonus %). */
export function computeDailyLoginReward(s: State = state): number {
  const cfg = getStreakConfig();
  const streakAfterClaim = Math.max(1, currentStreak(s));
  const streakPct = streakDayBonusPct(streakAfterClaim, cfg);
  const lvlMult = activityLevelMult(s.level);
  return Math.max(1, Math.round(BASE_DAILY_LOGIN_REWARD * lvlMult * (1 + streakPct / 100)));
}

/** Grants dynamic chalk if user hasn't claimed today. Returns granted amount (0 if already claimed). */
export function claimDailyLoginIfNeeded(): number {
  const today = new Date().toISOString().slice(0, 10);
  if (state.lastDailyLoginAt === today) return 0;
  let granted = 0;
  set(s => {
    const loginDays = Array.from(new Set([...(s.loginDays ?? []), today]));
    const withLogin: State = { ...s, loginDays, lastDailyLoginAt: today };
    const reward = computeDailyLoginReward(withLogin);
    granted = reward;
    const next: State = {
      ...withLogin,
      chalk: withLogin.chalk + reward,
      totalChalkEarned: withLogin.totalChalkEarned + reward,
    };
    return applyStreakProgress(s, next);
  });
  return granted;
}

// ===== Badge rewards =====
export const BADGE_CHALK_REWARD = 50;

const badgeListeners = new Set<(ids: string[]) => void>();
export function onBadgesAwarded(cb: (ids: string[]) => void): () => void {
  badgeListeners.add(cb);
  return () => { badgeListeners.delete(cb); };
}
function emitBadges(ids: string[]) {
  if (!ids.length) return;
  // Defer to next tick so React state updates flush before toasts fire.
  setTimeout(() => badgeListeners.forEach(l => { try { l(ids); } catch {} }), 0);
}

/**
 * Merge `addIds` into `s.badges`, granting +50 chalk for each badge id that
 * has not yet been rewarded (tracked in `badgeChalkClaimedFor`). Fires the
 * badge-awarded event for any newly-awarded badges (not for chalk-only catch-up).
 */
function applyBadges(s: State, addIds: string[], silent = false): State {
  const haveBadges = new Set(s.badges);
  const fresh = addIds.filter(id => !haveBadges.has(id));
  const nextBadges = fresh.length ? [...s.badges, ...fresh] : s.badges;

  const claimed = new Set(s.badgeChalkClaimedFor ?? []);
  const toReward = nextBadges.filter(id => !claimed.has(id));
  const reward = toReward.length * BADGE_CHALK_REWARD;
  const nextClaimed = toReward.length ? [...(s.badgeChalkClaimedFor ?? []), ...toReward] : (s.badgeChalkClaimedFor ?? []);

  if (!silent && fresh.length) emitBadges(fresh);

  return {
    ...s,
    badges: nextBadges,
    badgeChalkClaimedFor: nextClaimed,
    chalk: s.chalk + reward,
    totalChalkEarned: s.totalChalkEarned + reward,
  };
}

/** Compute every badge id the player currently deserves based on their state. */
function deservedBadges(s: State): string[] {
  const out: string[] = [];
  // From logs
  if (s.logs.length > 0 || s.stats.totalLogs > 0) out.push("first_send");
  if (s.logs.some(l => l.attemptType === "flash")) out.push("first_flash");
  if (s.logs.some(l => l.styles.includes("slab"))) out.push("slab_survivor");
  if (s.logs.some(l => l.styles.includes("overhang"))) out.push("overhang_enjoyer");
  if (s.totalChalkEarned >= 1000) out.push("chalk_monster");
  if (s.logs.filter(l => l.styles.includes("crimp")).length >= 5) out.push("tiny_crimp");
  // Bosses
  if (s.bosses.some(b => b.sent)) out.push("crux_breaker");
  if (s.bosses.filter(b => b.sent).length >= 3) out.push("project_slayer");
  // Levels
  if (s.level >= 6) out.push("dyno_unlocked");
  if (s.level >= 10) out.push("demigod_unlocked");
  // Items
  if (s.owned.includes("crocs")) out.push("crocs_equipped");
  if (s.owned.some(id => getItem(id)?.group === "buddy")) out.push("first_buddy");
  // Shop activity
  const purchased = s.owned.length;
  if (purchased >= 1) out.push("first_purchase");
  if (purchased >= 5) out.push("five_purchases");
  if (Object.values(s.equipped).some(Boolean)) out.push("first_equip");
  if (allRequiredSlotsEquipped(s)) out.push("all_slots_equipped");
  // Strength
  if ((s.strengthSessions ?? []).some(x => x.bossSend)) out.push("first_strength_boss");
  if (Object.values(s.strengthLevels ?? {}).some(v => (v ?? 0) >= 3)) out.push("strength_tier_3");
  return out;
}

/**
 * Retroactively award any deserved badges and back-pay the +50 chalk for every
 * badge the user already has but hasn't been rewarded for yet. Safe to call
 * multiple times — `badgeChalkClaimedFor` makes it idempotent.
 */
export function runRetroBadgeAudit() {
  // Silent: back-pay chalk + grant deserved badges, but never replay the
  // celebratory animation for badges the user already has or for retro grants.
  set(s => applyBadges(s, deservedBadges(s), true));
}
export function grantFreeItems(items: { id: string; price: number; slot: Slot; consumableBonus?: number }[]) {
  const free = items.filter(i => i.price === 0 && !i.consumableBonus);
  if (!free.length) return;
  set(s => {
    const ownedSet = new Set(s.owned);
    const equipped = { ...s.equipped };
    let changed = false;
    for (const it of free) {
      if (!ownedSet.has(it.id)) { ownedSet.add(it.id); changed = true; }
      if (!equipped[it.slot]) { equipped[it.slot] = it.id; changed = true; }
    }
    if (!changed) return s;
    return { ...s, owned: Array.from(ownedSet), equipped };
  });
}

// ----- Boss actions -----
/** True if a boss send was already logged on the given local date string (toDateString()). */
export function hasBossSendOnDate(dateISO: string): boolean {
  const target = new Date(dateISO).toDateString();
  return state.logs.some(l =>
    l.isBoss &&
    (l.attemptType === "send" || l.attemptType === "flash") &&
    new Date(l.date).toDateString() === target
  );
}

export function attemptBoss(bossId: string, outcome: BossAttempt["outcome"], notes?: string) {
  const boss = state.bosses.find(b => b.id === bossId); if (!boss) return null;
  let activity: ActivityType = outcome === "send" || outcome === "flash" ? "boss_send" : "boss_attempt";
  // Boss difficulty (1-10) vs player ceiling (1-10) → reuse the same ratio scale.
  // Map boss.difficulty (1–10) to a V-rank-ish value (×1.4) so a difficulty-6 boss
  // has the same "feel" as a V8 problem against a V8 ceiling.
  const ceiling = playerCeiling(state);
  const diffMult = bossDifficultyMultiplier(boss.difficulty ?? 1, ceiling);
  const styleForCalc: Style[] = boss.styles && boss.styles.length ? boss.styles : (boss.style ? [boss.style] : []);
  const breakdown = computeChalk(activity, styleForCalc, outcome === "send" || outcome === "flash", outcome === "flash", diffMult);
  const att: BossAttempt = { id: crypto.randomUUID(), date: new Date().toISOString(), outcome, chalk: breakdown.total, notes };

  set(s => {
    const bosses = s.bosses.map(b => {
      if (b.id !== bossId) return b;
      let highPoint = b.highPoint ?? 0;
      if (outcome === "send" || outcome === "flash") highPoint = 100;
      else highPoint = Math.min(95, highPoint + 15);
      const sent = outcome === "send" || outcome === "flash";
      return { ...b, attempts: [att, ...(b.attempts ?? [])], highPoint, sent: b.sent || sent, sentDate: sent ? att.date : b.sentDate };
    });
    const sentNow = outcome === "send" || outcome === "flash";
    const add: string[] = [];
    if (sentNow) add.push("crux_breaker");
    const bossesSent = bosses.filter(b => b.sent).length;
    if (bossesSent >= 3) add.push("project_slayer");
    const next: State = {
      ...s,
      chalk: s.chalk + att.chalk,
      totalChalkEarned: s.totalChalkEarned + att.chalk,
      bosses,
      pendingConsumable: null,
      stats: { ...s.stats, bossesSent, totalSends: s.stats.totalSends + (sentNow ? 1 : 0), totalFlashes: s.stats.totalFlashes + (outcome === "flash" ? 1 : 0) },
    };
    return applyStreakProgress(s, applyBadges(next, add));
  });
  return { attempt: att, breakdown };
}

export function setActiveBoss(bossId: string) {
  set(s => ({ ...s, bosses: s.bosses.map(b => ({ ...b, active: b.id === bossId })) }));
}

export function createBoss(name: string, grade: string, style: Style, difficulty: number, emoji?: string) {
  set(s => ({
    ...s,
    bosses: [
      ...s.bosses,
      {
        id: "custom-" + crypto.randomUUID(),
        name, grade,
        styles: [style], style,
        difficulty,
        emoji: emoji || "👹",
        flavor: "A custom nemesis.",
        attempts: [], highPoint: 0,
        sent: false,
        createdAt: new Date().toISOString(),
      },
    ],
  }));
}

// ===================== BOSS PROJECTS (user-saved) =====================

export interface BossProjectInput {
  grade: string;
  styles: Style[];
  gymId?: string;
  holdColorId?: string;
  notes?: string;
  name?: string;
}

export function activeBossProjects(s: State = state): Boss[] {
  return s.bosses.filter(b => !b.sent && !b.defeated);
}

/** Removes any active boss whose deadline has passed; applies the chalk penalty for each. */
export function expireOverdueBosses(): Boss[] {
  const now = Date.now();
  const expired: Boss[] = [];
  set(s => {
    const bosses = s.bosses.map(b => {
      if (isBossExpired(b, now)) {
        expired.push(b);
        return { ...b, defeated: true, defeatedDate: new Date(now).toISOString(), defeatedReason: "expired" as const };
      }
      return b;
    });
    if (expired.length === 0) return s;
    const penalty = expired.length * BOSS_DEFEAT_PENALTY;
    return { ...s, bosses, chalk: Math.max(0, s.chalk - penalty) };
  });
  return expired;
}

export function createBossProject(input: BossProjectInput): { boss: Boss; ok: boolean; reason?: string } {
  if (activeBossProjects(state).length >= MAX_ACTIVE_BOSSES) {
    return { boss: null as unknown as Boss, ok: false, reason: `You can only have ${MAX_ACTIVE_BOSSES} active boss projects at once.` };
  }
  const boss: Boss = {
    id: "boss-" + crypto.randomUUID(),
    name: input.name?.trim() || undefined,
    grade: input.grade,
    styles: input.styles,
    gymId: input.gymId,
    holdColorId: input.holdColorId,
    notes: input.notes,
    createdAt: new Date().toISOString(),
    sent: false,
    attempts: [],
    highPoint: 0,
  };
  set(s => ({ ...s, bosses: [...s.bosses, boss] }));
  return { boss, ok: true };
}

export function markBossSent(bossId: string) {
  set(s => {
    const add: string[] = [];
    const bosses = s.bosses.map(b => b.id === bossId ? { ...b, sent: true, sentDate: new Date().toISOString(), highPoint: 100 } : b);
    if (bosses.some(b => b.sent)) add.push("crux_breaker");
    if (bosses.filter(b => b.sent).length >= 3) add.push("project_slayer");
    return applyBadges({ ...s, bosses }, add);
  });
}

/** User manually admits defeat (e.g. gym reset the problem). Applies chalk penalty. */
export function admitBossDefeat(bossId: string) {
  set(s => {
    const bosses = s.bosses.map(b => b.id === bossId ? { ...b, defeated: true, defeatedDate: new Date().toISOString(), defeatedReason: "admitted" as const } : b);
    return { ...s, bosses, chalk: Math.max(0, s.chalk - BOSS_DEFEAT_PENALTY) };
  });
}

export function adminAdjustChalk(delta: number) {
  set(s => ({ ...s, chalk: Math.max(0, s.chalk + delta), totalChalkEarned: delta > 0 ? s.totalChalkEarned + delta : s.totalChalkEarned }));
}

export function adminSetLevel(delta: number) {
  set(s => {
    const max = LEVELS[LEVELS.length - 1].level;
    const next = Math.max(1, Math.min(max, s.level + delta));
    return { ...s, level: next };
  });
}

export function adminSetIgnoreLevelReq(value: boolean) {
  set(s => ({ ...s, ignoreLevelReq: value }));
}

/** Admin: trigger a streak milestone reward (7/14/21/30) immediately for self. Ignores "already awarded". */
export function adminTriggerStreakReward(day: number): { chalkCache: number; bannerLabel: string } {
  const cap = computeDailyCap(state.level, getDailyCapConfig());
  const r = rewardsForDay(day, cap, getStreakConfig());
  set(s => {
    let next = withBuffs(s, r.addedBuffs);
    if (r.chalkCache > 0) {
      next = { ...next, chalk: next.chalk + r.chalkCache, totalChalkEarned: next.totalChalkEarned + r.chalkCache };
    }
    return next;
  });
  emitStreakEvent(r.bannerLabel);
  return { chalkCache: r.chalkCache, bannerLabel: r.bannerLabel };
}

export function adminSeedMockData() {
  const styles: Style[] = ["slab","vertical","overhang","crimp","sloper","compression","coordination","dyno","mantle","cave"];
  const grades = ["V1","V2","V3","V4","V5","V6","V7"];
  const locations = ["Local Gym","Boulder Cave","Garage Wall","The Spot","Sunset Crag","Movement HQ"];
  const activities: ActivityType[] = ["warmup_boulder","boulder","hard_boulder","boulder_send"];
  const attempts: AttemptType[] = ["flash","send","project"];

  const now = Date.now();
  const logs: BoulderLog[] = [];
  let totalEarned = 0;
  let totalSends = 0;
  let totalFlashes = 0;

  const SEED_COUNT = 40;
  const SPAN_DAYS = 90;
  for (let i = 0; i < SEED_COUNT; i++) {
    const activity = activities[i % activities.length];
    const attemptType = attempts[i % attempts.length];
    const styleSet: Style[] = [styles[i % styles.length], styles[(i * 3 + 1) % styles.length]];
    const sent = attemptType === "send" || attemptType === "flash";
    const breakdown = computeChalk(activity, styleSet, sent, attemptType === "flash");
    const dayOffset = Math.floor((i / (SEED_COUNT - 1)) * (SPAN_DAYS - 1));
    logs.push({
      id: crypto.randomUUID(),
      date: new Date(now - dayOffset * 86400000 - Math.floor(Math.random() * 7200000)).toISOString(),
      activity,
      duration: 30 + (i % 4) * 15,
      location: locations[i % locations.length],
      grade: grades[i % grades.length],
      styles: styleSet,
      problemsTried: 5 + (i % 6),
      sends: sent ? 1 + (i % 3) : 0,
      hardestSend: sent ? grades[Math.min(grades.length - 1, (i % grades.length) + 1)] : undefined,
      notes: i % 4 === 0 ? "Felt strong on the crimps." : undefined,
      chalkBase: breakdown.base,
      chalkBonus: breakdown.total - breakdown.base,
      chalkTotal: breakdown.total,
      attemptType,
    });
    totalEarned += breakdown.total;
    if (sent) totalSends++;
    if (attemptType === "flash") totalFlashes++;
  }

  set(s => {
    const bosses: Boss[] = BOSS_TEMPLATES.slice(0, 5).map((t, i) => {
      const sent = i < 2;
      const sentDate = sent ? new Date(now - (i + 1) * 5 * 86400000).toISOString() : undefined;
      const bossAttempts: BossAttempt[] = Array.from({ length: 2 + i }, (_, k) => ({
        id: crypto.randomUUID(),
        date: new Date(now - (i + 1) * 86400000 - k * 3600000).toISOString(),
        outcome: sent && k === 0 ? (i === 0 ? "flash" : "send") : "attempt",
        chalk: sent && k === 0 ? 250 : 50,
        notes: k === 0 ? "Crux felt doable." : undefined,
      }));
      return {
        ...spawnBoss(t),
        active: i === 2,
        sent,
        sentDate,
        highPoint: sent ? 100 : 30 + i * 15,
        attempts: bossAttempts,
      };
    });
    return {
      ...s,
      logs: [...logs, ...s.logs],
      bosses,
      chalk: s.chalk + totalEarned,
      totalChalkEarned: s.totalChalkEarned + totalEarned,
      stats: {
        ...s.stats,
        totalLogs: s.stats.totalLogs + logs.length,
        totalSends: s.stats.totalSends + totalSends,
        totalFlashes: s.stats.totalFlashes + totalFlashes,
        bossesSent: 2,
      },
    };
  });
}

export function resetGame() {
  state = initialState();
  persist();
  listeners.forEach(l => l());
}

export { ACTIVITY_LABELS };

// Hook to ensure persistence updates after mount (no-op safe)
export function usePersistOnMount() {
  useEffect(() => { persist(); }, []);
}
