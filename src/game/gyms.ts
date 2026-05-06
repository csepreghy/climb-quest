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
  return { gyms: [], gradingSystems: [V_GRADES, FRENCH_GRADES], lastUsedGymId: null };
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
function persist() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} }
function set(u: (s: GymState) => GymState) { state = u(state); persist(); listeners.forEach(l => l()); }

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
