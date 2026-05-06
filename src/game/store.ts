import { useEffect, useSyncExternalStore } from "react";
import {
  ACTIVITY_LABELS, ActivityType, BADGES, BASE_CHALK, BOSS_TEMPLATES,
  ITEM_BY_ID, LEVELS, ShopItem, Style, BossTemplate, Gender,
} from "./data";

// ----- Types -----
export interface BoulderLog {
  id: string;
  date: string;            // ISO
  activity: ActivityType;
  duration?: number;       // minutes
  location?: string;
  grade?: string;
  styles: Style[];
  problemsTried?: number;
  sends?: number;
  hardestSend?: string;
  notes?: string;
  chalkBase: number;
  chalkBonus: number;
  chalkTotal: number;
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

export type Equipped = Partial<Record<"shoes"|"chalk"|"outfit"|"bottoms"|"hat"|"hand"|"accessory"|"aura"|"title", string>>;

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
}

const STORAGE_KEY = "climbquest:v1";

const initialState = (): State => ({
  level: 1,
  chalk: 0,
  totalChalkEarned: 0,
  gender: "neutral",
  owned: ["rental_shoes", "plain_chalk"],
  equipped: { shoes: "rental_shoes", chalk: "plain_chalk" },
  pendingConsumable: null,
  badges: [],
  bosses: [
    { ...spawnBoss(BOSS_TEMPLATES[0]), active: true },
    spawnBoss(BOSS_TEMPLATES[1]),
  ],
  logs: [],
  stats: { totalLogs: 0, totalSends: 0, totalFlashes: 0, bossesSent: 0 },
});

function spawnBoss(t: BossTemplate): Boss {
  return { id: t.id + "-" + Math.random().toString(36).slice(2,7), name: t.name, grade: t.grade, style: t.style, difficulty: t.difficulty, emoji: t.emoji, flavor: t.flavor, attempts: [], highPoint: 0, sent: false };
}

// ----- Store -----
let state: State = load();
const listeners = new Set<() => void>();

function load(): State {
  if (typeof window === "undefined") return initialState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState();
    const parsed = JSON.parse(raw);
    return { ...initialState(), ...parsed };
  } catch { return initialState(); }
}
function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}
function set(updater: (s: State) => State) {
  state = updater(state);
  persist();
  listeners.forEach(l => l());
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
  return LEVELS.find(l => l.level === s.level + 1);
}
export function currentLevel(s: State) {
  return LEVELS.find(l => l.level === s.level)!;
}
export function activeBoss(s: State) {
  return s.bosses.find(b => b.active && !b.sent) ?? s.bosses.find(b => !b.sent);
}

// ----- Chalk computation -----
export interface ChalkBreakdown {
  base: number;
  bonuses: { source: string; amount: number }[];
  total: number;
}
export function computeChalk(activity: ActivityType, styles: Style[], sent = false): ChalkBreakdown {
  const base = BASE_CHALK[activity] ?? 50;

  const bonuses: { source: string; amount: number }[] = [];
  if (sent && (activity === "warmup_boulder" || activity === "boulder" || activity === "hard_boulder")) {
    bonuses.push({ source: "Send", amount: BASE_CHALK.boulder_send });
  }
  // Equipped items
  const eq = state.equipped;
  for (const slotKey of Object.keys(eq) as (keyof Equipped)[]) {
    const id = eq[slotKey]; if (!id) continue;
    const item = ITEM_BY_ID[id]; if (!item?.bonus) continue;
    const b = item.bonus;
    let applies = false;
    if (b.appliesTo === "all") applies = true;
    else if (b.appliesTo && b.appliesTo.includes(activity)) applies = true;
    if (b.styleMatch && styles.some(s => b.styleMatch!.includes(s))) applies = true;
    if (applies && b.mult > 0) {
      bonuses.push({ source: item.name, amount: Math.round(base * b.mult) });
    }
  }
  // Consumable
  if (state.pendingConsumable) {
    const item = ITEM_BY_ID[state.pendingConsumable];
    if (item?.consumableBonus) bonuses.push({ source: item.name + " (consumed)", amount: Math.round(base * item.consumableBonus) });
  }
  const total = base + bonuses.reduce((a,b)=>a+b.amount, 0);
  return { base, bonuses, total };
}

// ----- Actions -----
export interface LogInput {
  activity: ActivityType;
  date?: string;
  duration?: number;
  location?: string;
  grade?: string;
  styles: Style[];
  sent?: boolean;
  problemsTried?: number;
  sends?: number;
  hardestSend?: string;
  notes?: string;
}

export function logBoulder(input: LogInput) {
  const breakdown = computeChalk(input.activity, input.styles, input.sent);
  const log: BoulderLog = {
    id: crypto.randomUUID(),
    date: input.date ?? new Date().toISOString(),
    activity: input.activity,
    duration: input.duration,
    location: input.location,
    grade: input.grade,
    styles: input.styles,
    problemsTried: input.problemsTried,
    sends: input.sends,
    hardestSend: input.hardestSend,
    notes: input.notes,
    chalkBase: breakdown.base,
    chalkBonus: breakdown.total - breakdown.base,
    chalkTotal: breakdown.total,
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
        totalSends: s.stats.totalSends + (log.sends ?? 1),
        totalFlashes: s.stats.totalFlashes,
        bossesSent: s.stats.bossesSent,
      },
    };
  });
  return { log, breakdown, newBadges: computeNewBadgesAfter() };
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
  const item = ITEM_BY_ID[id];
  if (!item) return { ok: false, reason: "Unknown item" };
  if (item.levelReq && state.level < item.levelReq) return { ok: false, reason: `Requires Level ${item.levelReq}` };
  if (item.rarity !== "consumable" && state.owned.includes(id)) return { ok: false, reason: "Already owned" };
  if (state.chalk < item.price) return { ok: false, reason: "Not enough Chalk" };
  set(s => {
    const owned = item.rarity === "consumable" ? s.owned : [...s.owned, id];
    const badges = new Set(s.badges);
    if (id === "crocs") badges.add("crocs_equipped");
    if (id === "golden_crocs") badges.add("golden_crocs");
    if (id === "minimal_kit") { badges.add("minimal_kit"); badges.add("shirtless_form"); }
    return { ...s, chalk: s.chalk - item.price, owned, badges: Array.from(badges) };
  });
  return { ok: true };
}

export function equipItem(id: string) {
  const item = ITEM_BY_ID[id]; if (!item) return;
  if (item.rarity === "consumable") {
    set(s => ({ ...s, pendingConsumable: id }));
    return;
  }
  set(s => ({ ...s, equipped: { ...s.equipped, [item.slot]: id } }));
}
export function unequipSlot(slot: keyof Equipped) {
  set(s => { const eq = { ...s.equipped }; delete eq[slot]; return { ...s, equipped: eq }; });
}
export function setGender(g: Gender) { set(s => ({ ...s, gender: g })); }

// ----- Boss actions -----
export function attemptBoss(bossId: string, outcome: BossAttempt["outcome"], notes?: string) {
  const boss = state.bosses.find(b => b.id === bossId); if (!boss) return null;
  let activity: ActivityType = outcome === "send" || outcome === "flash" ? "boss_send" : "boss_attempt";
  const breakdown = computeChalk(activity, [boss.style]);
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
