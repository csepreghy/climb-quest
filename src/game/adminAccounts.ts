// Admin "test" vs "personal" account slots.
// Each slot is persisted as its own row in the backend `user_game_state` table
// keyed by (user_id, slot). This file only tracks WHICH slot is active in this
// browser; loading and saving the slot data is handled by GameSync.
import { useSyncExternalStore } from "react";

export type AccountSlot = "test" | "personal";

const ACTIVE_KEY = (uid: string) => `climbquest:admin:activeSlot:${uid}`;
// Legacy localStorage blob keys (no longer used; cleaned up on first switch).
const LEGACY_SLOT_KEY = (uid: string, slot: AccountSlot) =>
  `climbquest:admin:slot:${slot}:${uid}`;

const listeners = new Set<() => void>();
function notify() { listeners.forEach(l => l()); }

export function getActiveSlot(uid: string | null): AccountSlot {
  if (!uid || typeof window === "undefined") return "test";
  const v = localStorage.getItem(ACTIVE_KEY(uid));
  return v === "personal" ? "personal" : "test";
}

/** Switch the active slot. GameSync will see the change and load the
 *  corresponding row from the backend. */
export function switchToSlot(uid: string, target: AccountSlot) {
  const current = getActiveSlot(uid);
  if (current === target) return;
  // Clean up any stale legacy localStorage blobs so they can never leak back.
  try {
    localStorage.removeItem(LEGACY_SLOT_KEY(uid, "test"));
    localStorage.removeItem(LEGACY_SLOT_KEY(uid, "personal"));
  } catch {}
  localStorage.setItem(ACTIVE_KEY(uid), target);
  notify();
}

/** Kept for backward compatibility with callers (e.g. Admin reset). No-op
 *  now that GameSync persists every change directly to the backend. */
export function snapshotActiveSlot(_uid: string) { /* no-op */ }

export function useActiveSlot(uid: string | null): AccountSlot {
  return useSyncExternalStore(
    cb => { listeners.add(cb); return () => listeners.delete(cb); },
    () => getActiveSlot(uid),
    () => getActiveSlot(uid),
  );
}
