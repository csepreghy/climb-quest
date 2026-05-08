import { useEffect, useSyncExternalStore } from "react";
import {
  ACTIVITY_LABELS, ActivityType, BADGES, BOSS_TEMPLATES,
  ITEM_BY_ID, LEVELS, ShopItem, Style, BossTemplate, Gender,
  GEAR_SLOTS, gearSlotsUnlocked, Slot,
} from "./data";
import { getItem } from "./customItems";
import { getActivityReward } from "./activityRewards";
import { resolvedLevel } from "./levelOverrides";
import { applyDailyCap, chalkUsedOnDate, computeDailyCap, currentStreak, getDailyCapConfig } from "./dailyCap";

// ----- Types -----
export type AttemptType = "flash" | "send" | "project";

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
  name: string;
  grade: string;
  style: Style;
  difficulty: number;
  emoji: string;
  flavor: string;
  attempts: BossAttempt[];
  highPoint: number; // 0-100
  sent: boolean;
  sentDate?: string;
  active?: boolean;
}

export type Equipped = Partial<Record<"shoes"|"chalk"|"outfit"|"bottoms"|"hat"|"hand"|"accessory"|"study"|"aura"|"title"|"powerup", string>>;

export interface State {
  level: number;
  chalk: number;
  totalChalkEarned: number;
  gender: Gender;
  owned: string[];        // item ids
  equipped: Equipped;
  pendingConsumable: string | null; // item id
  badges: string[];       // badge ids
  bosses: Boss[];
  logs: BoulderLog[];
  stats: { totalLogs: number; totalSends: number; totalFlashes: number; bossesSent: number; };
  ignoreLevelReq?: boolean;
  /** ISO timestamp when the user completed first-time onboarding. */
  onboardedAt?: string | null;
  /** ISO date (YYYY-MM-DD) of the most recent daily-login chalk grant. */
  lastDailyLoginAt?: string | null;
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
  bosses: [
    { ...spawnBoss(BOSS_TEMPLATES[0]), active: true },
    spawnBoss(BOSS_TEMPLATES[1]),
  ],
  logs: [],
  stats: { totalLogs: 0, totalSends: 0, totalFlashes: 0, bossesSent: 0 },
  ignoreLevelReq: false,
  onboardedAt: null,
  lastDailyLoginAt: null,
});

function spawnBoss(t: BossTemplate): Boss {
  return { id: t.id + "-" + Math.random().toString(36).slice(2,7), name: t.name, grade: t.grade, style: t.style, difficulty: t.difficulty, emoji: t.emoji, flavor: t.flavor, attempts: [], highPoint: 0, sent: false };
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
  for (const b of s.bosses) if (b.sent && b.difficulty > max) max = b.difficulty;
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
export function computeChalk(
  activity: ActivityType,
  styles: Style[],
  sent = false,
  flashed = false,
  difficultyMult = 1,
  dateISO?: string,
): ChalkBreakdown {
  const baseRaw = getActivityReward(activity);
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

  // Send flat bonus first (additive, not stacked %)
  if (sent && (activity === "warmup_boulder" || activity === "boulder" || activity === "hard_boulder")) {
    const amt = Math.round(getActivityReward("boulder_send") * difficultyMult);
    bonuses.push({ source: "Send", amount: amt });
    running += amt;
  }

  // Flash: +50% on the base chalk
  if (flashed && (activity === "warmup_boulder" || activity === "boulder" || activity === "hard_boulder")) {
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
  if (critProb > 0 && Math.random() < critProb) {
    bonuses.push({ source: `Crit! ×2 (${Math.round(critProb * 100)}%)`, amount: running });
    running *= 2;
  }

  // Daily cap — soft, with diminishing returns. Applied last.
  const dateForCap = dateISO ?? new Date().toISOString();
  const cfg = getDailyCapConfig();
  if (cfg.enabled) {
    const used = chalkUsedOnDate(state, dateForCap);
    const cap = computeDailyCap(state.level, currentStreak(state), cfg);
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
  chalkMultiplier?: number;
  /** Pre-computed difficulty multiplier (climb grade vs player ceiling). Default 1. */
  difficultyMult?: number;
}

export function logBoulder(input: LogInput) {
  const raw = computeChalk(input.activity, input.styles, input.sent, input.attemptType === "flash", input.difficultyMult ?? 1, input.date);
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
  };

  set(s => {
    const newBadges = computeNewBadges(s, log);
    return {
      ...s,
      chalk: s.chalk + log.chalkTotal,
      totalChalkEarned: s.totalChalkEarned + log.chalkTotal,
      logs: [log, ...s.logs].slice(0, 200),
      pendingConsumable: null,
      badges: Array.from(new Set([...s.badges, ...newBadges])),
      stats: {
        ...s.stats,
        totalLogs: s.stats.totalLogs + 1,
        totalSends: s.stats.totalSends + (input.sent || input.attemptType === "flash" || input.attemptType === "send" ? 1 : 0),
        totalFlashes: s.stats.totalFlashes + (input.attemptType === "flash" ? 1 : 0),
        bossesSent: s.stats.bossesSent + (input.isBoss && (input.attemptType === "flash" || input.attemptType === "send") ? 1 : 0),
      },
    };
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

export function updateLog(id: string, input: LogInput) {
  const raw = computeChalk(input.activity, input.styles, input.sent, input.attemptType === "flash", input.difficultyMult ?? 1, input.date);
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
  set(s => ({
    ...s,
    chalk: s.chalk - next.cost,
    level: next.level,
    badges: addLevelBadges(s.badges, next.level),
  }));
  return { ok: true, unlocks: next.unlocks };
}
function addLevelBadges(b: string[], lvl: number): string[] {
  const set = new Set(b);
  if (lvl >= 6) set.add("dyno_unlocked");
  if (lvl >= 10) set.add("demigod_unlocked");
  return Array.from(set);
}

export function buyItem(id: string): { ok: boolean; reason?: string } {
  const item = getItem(id);
  if (!item) return { ok: false, reason: "Unknown item" };
  if (!state.ignoreLevelReq && item.levelReq && state.level < item.levelReq) return { ok: false, reason: `Requires Level ${item.levelReq}` };
  if (!item.consumableBonus && state.owned.includes(id)) return { ok: false, reason: "Already owned" };
  const price = effectivePrice(state, item.price);
  if (state.chalk < price) return { ok: false, reason: "Not enough Chalk" };
  set(s => {
    const owned = item.consumableBonus ? s.owned : [...s.owned, id];
    const badges = new Set(s.badges);
    if (id === "crocs") badges.add("crocs_equipped");
    if (id === "golden_crocs") badges.add("golden_crocs");
    if (id === "minimal_kit") { badges.add("minimal_kit"); badges.add("shirtless_form"); }
    return { ...s, chalk: s.chalk - price, owned, badges: Array.from(badges) };
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
  set(s => ({ ...s, equipped: { ...s.equipped, [item.slot]: id } }));
  return { ok: true };
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
export function setGender(g: Gender) { set(s => ({ ...s, gender: g })); }
export function completeOnboarding() {
  set(s => ({ ...s, onboardedAt: new Date().toISOString() }));
}
export function resetOnboarding() {
  set(s => ({ ...s, onboardedAt: null }));
}

export const DAILY_LOGIN_REWARD = 50;
/** Grants 50 chalk if user hasn't claimed today. Returns true if granted. */
export function claimDailyLoginIfNeeded(): boolean {
  const today = new Date().toISOString().slice(0, 10);
  if (state.lastDailyLoginAt === today) return false;
  set(s => ({
    ...s,
    chalk: s.chalk + DAILY_LOGIN_REWARD,
    totalChalkEarned: s.totalChalkEarned + DAILY_LOGIN_REWARD,
    lastDailyLoginAt: today,
  }));
  return true;
}

/** Auto-grant & auto-equip every catalog item priced 0. Idempotent. */
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
  const diffMult = bossDifficultyMultiplier(boss.difficulty, ceiling);
  const breakdown = computeChalk(activity, [boss.style], outcome === "send" || outcome === "flash", outcome === "flash", diffMult);
  const att: BossAttempt = { id: crypto.randomUUID(), date: new Date().toISOString(), outcome, chalk: breakdown.total, notes };

  set(s => {
    const bosses = s.bosses.map(b => {
      if (b.id !== bossId) return b;
      let highPoint = b.highPoint;
      if (outcome === "send" || outcome === "flash") highPoint = 100;
      else highPoint = Math.min(95, highPoint + 15);
      const sent = outcome === "send" || outcome === "flash";
      return { ...b, attempts: [att, ...b.attempts], highPoint, sent: b.sent || sent, sentDate: sent ? att.date : b.sentDate };
    });
    const sentNow = outcome === "send" || outcome === "flash";
    const badges = new Set(s.badges);
    if (sentNow) badges.add("crux_breaker");
    const bossesSent = bosses.filter(b => b.sent).length;
    if (bossesSent >= 3) badges.add("project_slayer");
    return {
      ...s,
      chalk: s.chalk + att.chalk,
      totalChalkEarned: s.totalChalkEarned + att.chalk,
      bosses,
      badges: Array.from(badges),
      pendingConsumable: null,
      stats: { ...s.stats, bossesSent, totalSends: s.stats.totalSends + (sentNow ? 1 : 0), totalFlashes: s.stats.totalFlashes + (outcome === "flash" ? 1 : 0) },
    };
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
      { id: "custom-" + crypto.randomUUID(), name, grade, style, difficulty, emoji: emoji || "👹", flavor: "A custom nemesis.", attempts: [], highPoint: 0, sent: false },
    ],
  }));
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
