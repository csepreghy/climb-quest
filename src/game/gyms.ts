// Gym data: gyms, hold colors, grading systems
import { useSyncExternalStore } from "react";

export type GradingKind = "v" | "french" | "number" | "color";

/** Canonical V grades for dropdowns elsewhere in the app */
export const V_SCALE = [
  "VB","V0","V1","V2","V3","V4","V5","V6","V7","V8",
  "V9","V10","V11","V12","V13","V14","V15","V16",
] as const;

/** Canonical French (Font) grades for dropdowns elsewhere in the app */
export const FRENCH_SCALE = [
  "3A","3B","3C","4A","4B","4C","5A","5B","5C",
  "6A","6A+","6B","6B+","6C","6C+",
  "7A","7A+","7B","7B+","7C","7C+",
  "8A","8A+","8B","8B+","8C","8C+",
  "9A",
] as const;

export interface GradeEquivalent {
  /** V scale start/end (inclusive). End optional — single grade OR open-ended last entry. */
  vStart?: string;
  vEnd?: string;
  /** French scale start/end */
  frenchStart?: string;
  frenchEnd?: string;
}

export interface GradingSystem {
  id: string;
  name: string;
  kind: GradingKind;
  /** For number kind */
  numberMin?: number;
  numberMax?: number;
  /** For color kind */
  colors?: { name: string; hex: string }[];
  /** Whether the last grade in the list is open-ended (e.g. 5 → 5+). */
  lastOpenEnded?: boolean;
  /** Map a grade label (e.g. "5", "Red") to V/French equivalent ranges */
  equivalents?: Record<string, GradeEquivalent>;
}

export interface HoldColor {
  id: string;
  name: string;
  hex: string;
  /** Optional second color — when set, the hold renders as a split circle (multicolor). */
  hex2?: string;
}

export interface Gym {
  id: string;
  name: string;
  location: string;
  primary: boolean;
  holdColors: HoldColor[];
  gradingSystemIds: string[];
}

export interface GymState {
  gyms: Gym[];
  gradingSystems: GradingSystem[];
  lastUsedGymId: string | null;
  /** Ids of admin-created public gyms the user has added to their list. */
  addedPublicGymIds: string[];
}

const KEY = "climbquest:gym:v1";

const V_GRADES: GradingSystem = { id: "v_grades", name: "V Scale", kind: "v" };
const FRENCH_GRADES: GradingSystem = { id: "french_grades", name: "French (Font)", kind: "french" };

const DEFAULT_HOLD_COLORS: HoldColor[] = [
  { id: "white", name: "White", hex: "#f5f5f5" },
  { id: "yellow", name: "Yellow", hex: "#fbbf24" },
  { id: "orange", name: "Orange", hex: "#f97316" },
  { id: "red", name: "Red", hex: "#ef4444" },
  { id: "purple", name: "Purple", hex: "#a855f7" },
  { id: "blue", name: "Blue", hex: "#3b82f6" },
  { id: "green", name: "Green", hex: "#22c55e" },
  { id: "black", name: "Black", hex: "#1f2937" },
];

function initial(): GymState {
  return { gyms: [], gradingSystems: [V_GRADES, FRENCH_GRADES], lastUsedGymId: null, addedPublicGymIds: [] };
}

let state: GymState = load();
const listeners = new Set<() => void>();

function load(): GymState {
  if (typeof window === "undefined") return initial();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initial();
    const parsed = JSON.parse(raw);
    const merged: GymState = { ...initial(), ...parsed };
    const ids = new Set(merged.gradingSystems.map(g => g.id));
    if (!ids.has("v_grades")) merged.gradingSystems.unshift(V_GRADES);
    if (!ids.has("french_grades")) merged.gradingSystems.push(FRENCH_GRADES);
    return merged;
  } catch { return initial(); }
}
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  remoteSave?.(state);
}
function set(u: (s: GymState) => GymState) { state = u(state); persist(); listeners.forEach(l => l()); }

let remoteSave: ((s: GymState) => void) | null = null;
export function bindGymsRemoteSync(saver: ((s: GymState) => void) | null) {
  remoteSave = saver;
}
export function getGymsSnapshot(): GymState { return state; }
export function replaceGymsState(next: GymState) {
  state = { ...initial(), ...next };
  const ids = new Set(state.gradingSystems.map(g => g.id));
  if (!ids.has("v_grades")) state.gradingSystems.unshift(V_GRADES);
  if (!ids.has("french_grades")) state.gradingSystems.push(FRENCH_GRADES);
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  listeners.forEach(l => l());
}

export function useGyms(): GymState {
  return useSyncExternalStore(
    cb => { listeners.add(cb); return () => listeners.delete(cb); },
    () => state, () => state,
  );
}

const id = () => Math.random().toString(36).slice(2, 9);

export function addGym(name: string, location: string) {
  set(s => ({
    ...s,
    gyms: [...s.gyms, {
      id: id(), name, location,
      primary: s.gyms.length === 0,
      holdColors: DEFAULT_HOLD_COLORS,
      gradingSystemIds: ["v_grades"],
    }],
  }));
}
export function updateGym(gymId: string, patch: Partial<Gym>) {
  set(s => ({ ...s, gyms: s.gyms.map(g => g.id === gymId ? { ...g, ...patch } : g) }));
}
export function deleteGym(gymId: string) {
  set(s => ({ ...s, gyms: s.gyms.filter(g => g.id !== gymId) }));
}
export function setPrimaryGym(gymId: string) {
  set(s => ({ ...s, gyms: s.gyms.map(g => ({ ...g, primary: g.id === gymId })) }));
}
export function setLastUsedGym(gymId: string) {
  set(s => ({ ...s, lastUsedGymId: gymId }));
}
export function addPublicGymToMine(gymId: string) {
  set(s => s.addedPublicGymIds.includes(gymId) ? s : { ...s, addedPublicGymIds: [...s.addedPublicGymIds, gymId] });
}
export function removePublicGymFromMine(gymId: string) {
  set(s => ({ ...s, addedPublicGymIds: s.addedPublicGymIds.filter(id => id !== gymId), lastUsedGymId: s.lastUsedGymId === gymId ? null : s.lastUsedGymId }));
}

export function addHoldColor(gymId: string, c: Omit<HoldColor, "id">) {
  set(s => ({ ...s, gyms: s.gyms.map(g => g.id === gymId ? { ...g, holdColors: [...g.holdColors, { ...c, id: id() }] } : g) }));
}
export function removeHoldColor(gymId: string, colorId: string) {
  set(s => ({ ...s, gyms: s.gyms.map(g => g.id === gymId ? { ...g, holdColors: g.holdColors.filter(c => c.id !== colorId) } : g) }));
}

export function addGradingSystem(g: Omit<GradingSystem, "id">) {
  const newG = { ...g, id: id() };
  set(s => ({ ...s, gradingSystems: [...s.gradingSystems, newG] }));
  return newG.id;
}
export function updateGradingSystem(gid: string, patch: Partial<GradingSystem>) {
  set(s => ({ ...s, gradingSystems: s.gradingSystems.map(g => g.id === gid ? { ...g, ...patch } : g) }));
}
export function deleteGradingSystem(gid: string) {
  if (gid === "v_grades" || gid === "french_grades") return;
  set(s => ({
    ...s,
    gradingSystems: s.gradingSystems.filter(g => g.id !== gid),
    gyms: s.gyms.map(g => ({ ...g, gradingSystemIds: g.gradingSystemIds.filter(x => x !== gid) })),
  }));
}
export function toggleGymGradingSystem(gymId: string, gsId: string) {
  set(s => ({
    ...s,
    gyms: s.gyms.map(g => {
      if (g.id !== gymId) return g;
      const has = g.gradingSystemIds.includes(gsId);
      return { ...g, gradingSystemIds: has ? g.gradingSystemIds.filter(x => x !== gsId) : [...g.gradingSystemIds, gsId] };
    }),
  }));
}
export function setEquivalent(gsId: string, gradeLabel: string, eq: GradeEquivalent) {
  set(s => ({
    ...s,
    gradingSystems: s.gradingSystems.map(g => {
      if (g.id !== gsId) return g;
      const equivalents = { ...(g.equivalents ?? {}), [gradeLabel]: eq };
      return { ...g, equivalents };
    }),
  }));
}

/** Enumerate grade labels for a system */
export function gradeLabels(g: GradingSystem): string[] {
  if (g.kind === "v") return [...V_SCALE];
  if (g.kind === "french") return [...FRENCH_SCALE];
  if (g.kind === "number") {
    const min = g.numberMin ?? 1, max = g.numberMax ?? 10;
    const out: string[] = [];
    for (let n = min; n <= max; n++) out.push(String(n));
    if (g.lastOpenEnded) out.push(`${max}+`);
    return out;
  }
  if (g.kind === "color") return (g.colors ?? []).map(c => c.name);
  return [];
}

/** Approximate French→V rank (V index 0 = VB). */
const FRENCH_TO_V: Record<string, number> = {
  "3A":0,"3B":0,"3C":0,"4A":1,"4B":1,"4C":1,"5A":1,"5B":1,"5C":1,
  "6A":2,"6A+":2,"6B":3,"6B+":4,"6C":5,"6C+":5,
  "7A":6,"7A+":7,"7B":8,"7B+":8,"7C":9,"7C+":10,
  "8A":11,"8A+":12,"8B":13,"8B+":14,"8C":15,"8C+":16,"9A":17,
};

/**
 * Universal grade → V-scale rank (0 = VB, 17 = V16+).
 * Handles V/French labels regardless of system, with sane fallbacks for
 * number/color systems and unknown labels.
 */
export function gradeToVRank(label: string | undefined, system?: GradingSystem): number {
  if (!label) return 1;
  const l = label.toUpperCase();
  // V-scale direct
  const vIdx = (V_SCALE as readonly string[]).indexOf(l);
  if (vIdx >= 0) return vIdx;
  // French direct
  if (FRENCH_TO_V[l] !== undefined) return FRENCH_TO_V[l];
  // System-specific fallbacks
  if (system) {
    if (system.kind === "number") {
      const n = parseInt(l);
      if (!isNaN(n)) {
        const min = system.numberMin ?? 1;
        const max = system.numberMax ?? 10;
        const span = Math.max(1, max - min);
        // map [min,max] → [1, 14]
        return Math.round(1 + ((n - min) / span) * 13);
      }
    }
    if (system.kind === "color" && system.colors) {
      const idx = system.colors.findIndex(c => c.name.toUpperCase() === l);
      if (idx >= 0) {
        const span = Math.max(1, system.colors.length - 1);
        return Math.round(1 + (idx / span) * 13);
      }
    }
  }
  return 5; // unknown → mid
}

/** Difficulty multiplier from climb rank vs player ceiling rank. */
export function difficultyMultiplier(climbRank: number, ceilingRank: number): number {
  const ceil = Math.max(1, ceilingRank);
  const ratio = climbRank / ceil;
  if (ratio <= 0.3) return 0.25;
  if (ratio <= 0.6) return 0.55;
  if (ratio <= 0.85) return 0.85;
  if (ratio <= 1.0) return 1.0;
  if (ratio <= 1.15) return 1.25;
  return 1.5;
}

