// Admin "test" vs "personal" account slots.
// Each admin user can swap between two independent local profiles. Each slot
// keeps its own game + gyms state in localStorage, and the active slot is the
// one synced to the backend.
import { useSyncExternalStore } from "react";
import {
  getGameStateSnapshot,
  replaceGameState,
  State as GameState,
} from "./store";
import {
  getGymsSnapshot,
  replaceGymsState,
  GymState,
} from "./gyms";

export type AccountSlot = "test" | "personal";

const ACTIVE_KEY = (uid: string) => `climbquest:admin:activeSlot:${uid}`;
const SLOT_KEY = (uid: string, slot: AccountSlot) =>
  `climbquest:admin:slot:${slot}:${uid}`;

interface SlotBlob {
  game?: GameState;
  gyms?: GymState;
}

const listeners = new Set<() => void>();
function notify() { listeners.forEach(l => l()); }

export function getActiveSlot(uid: string | null): AccountSlot {
  if (!uid || typeof window === "undefined") return "test";
  const v = localStorage.getItem(ACTIVE_KEY(uid));
  return v === "personal" ? "personal" : "test";
}

function setActiveSlot(uid: string, slot: AccountSlot) {
  localStorage.setItem(ACTIVE_KEY(uid), slot);
  notify();
}

function saveSlot(uid: string, slot: AccountSlot, blob: SlotBlob) {
  try { localStorage.setItem(SLOT_KEY(uid, slot), JSON.stringify(blob)); } catch {}
}

function loadSlot(uid: string, slot: AccountSlot): SlotBlob | null {
  try {
    const raw = localStorage.getItem(SLOT_KEY(uid, slot));
    if (!raw) return null;
    return JSON.parse(raw) as SlotBlob;
  } catch { return null; }
}

/** Snapshot the live state into the given slot's localStorage entry. */
export function snapshotActiveSlot(uid: string) {
  const slot = getActiveSlot(uid);
  saveSlot(uid, slot, { game: getGameStateSnapshot(), gyms: getGymsSnapshot() });
}

/** Switch to a target slot, persisting the current live state into the
 *  outgoing slot first, then loading the incoming slot (or an empty profile). */
export function switchToSlot(uid: string, target: AccountSlot) {
  const current = getActiveSlot(uid);
  if (current === target) return;
  // Save outgoing
  saveSlot(uid, current, { game: getGameStateSnapshot(), gyms: getGymsSnapshot() });
  // Load incoming
  const incoming = loadSlot(uid, target);
  // replaceGameState/replaceGymsState merge with their own initial(), so passing
  // an empty object yields a fresh empty profile.
  replaceGameState((incoming?.game ?? ({} as GameState)));
  replaceGymsState((incoming?.gyms ?? ({} as GymState)));
  setActiveSlot(uid, target);
}

export function useActiveSlot(uid: string | null): AccountSlot {
  return useSyncExternalStore(
    cb => { listeners.add(cb); return () => listeners.delete(cb); },
    () => getActiveSlot(uid),
    () => getActiveSlot(uid),
  );
}
