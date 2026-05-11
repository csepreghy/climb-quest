import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  bindGameRemoteSync,
  getGameStateSnapshot,
  replaceGameState,
  adminSeedMockData,
  runRetroBadgeAudit,
  State as GameState,
} from "./store";
import {
  bindGymsRemoteSync,
  getGymsSnapshot,
  replaceGymsState,
  GymState,
} from "./gyms";
import { getActiveSlot, useActiveSlot, AccountSlot } from "./adminAccounts";

/**
 * Loads the active slot's game + gyms from the backend on sign-in (and on slot
 * change), and debounce-saves changes back to that same (user_id, slot) row.
 *
 * Admins have two slots ("test" and "personal"), each persisted as its own
 * row in `user_game_state`. Non-admins always use "test".
 */
export function GameSync() {
  const { user, hasAdminRole } = useAuth();
  const slot: AccountSlot = useActiveSlot(user?.id ?? null);
  const slotRef = useRef<AccountSlot>(slot);
  const userIdRef = useRef<string | null>(null);
  const saveTimer = useRef<number | null>(null);
  const saveInFlight = useRef(false);
  const lastRemoteUpdatedAt = useRef<string | null>(null);
  const remoteHadContent = useRef(false);
  const pending = useRef<{ game?: GameState; gyms?: GymState }>({});
  const flushRef = useRef<(() => void) | null>(null);

  // Heuristic: does this game state look like a real, populated profile?
  // Used as a safety guard so we never overwrite a populated remote row with
  // an empty/fresh-profile local state (which would silently wipe the slot).
  const looksPopulated = (g: any): boolean => {
    if (!g || typeof g !== "object") return false;
    if (Array.isArray(g.logs) && g.logs.length > 0) return true;
    if (Array.isArray(g.strengthSessions) && g.strengthSessions.length > 0) return true;
    if (typeof g.level === "number" && g.level > 1) return true;
    if (typeof g.totalChalkEarned === "number" && g.totalChalkEarned > 500) return true;
    if (Array.isArray(g.owned) && g.owned.length > 1) return true;
    return false;
  };

  // Flush any pending writes before the page is hidden / unloaded so we
  // don't lose the last few hundred ms of activity (e.g. a strength session
  // logged right before navigating away).
  useEffect(() => {
    const onHide = () => { flushRef.current?.(); };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") onHide();
    };
    window.addEventListener("beforeunload", onHide);
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("beforeunload", onHide);
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const uid = user?.id ?? null;
    userIdRef.current = uid;
    slotRef.current = slot;

    if (!uid) {
      bindGameRemoteSync(null);
      bindGymsRemoteSync(null);
      return;
    }

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("user_game_state")
        .select("game, gyms, updated_at")
        .eq("user_id", uid)
        .eq("slot", slot)
        .maybeSingle();

      if (cancelled) return;

      if (!error && data) {
        lastRemoteUpdatedAt.current = data.updated_at ?? null;
        const game = data.game as unknown as GameState | Record<string, never>;
        const gyms = data.gyms as unknown as GymState | Record<string, never>;
        remoteHadContent.current = looksPopulated(game);
        // Always replace — empty object yields a fresh profile, which is what
        // a brand-new personal slot should look like.
        replaceGameState((game ?? {}) as GameState);
        replaceGymsState((gyms ?? {}) as GymState);
      } else {
        // No row yet for this slot — start fresh and create the row.
        remoteHadContent.current = false;
        replaceGameState({} as GameState);
        replaceGymsState({} as GymState);
        const { data: inserted } = await supabase.from("user_game_state").upsert({
          user_id: uid,
          slot,
          updated_at: new Date().toISOString(),
          game: getGameStateSnapshot() as any,
          gyms: getGymsSnapshot() as any,
        }, { onConflict: "user_id,slot" }).select("updated_at").maybeSingle();
        lastRemoteUpdatedAt.current = inserted?.updated_at ?? null;
      }

      // Only seed mock data into the admin's TEST slot, never personal.
      if (hasAdminRole && slot === "test") {
        const snap = getGameStateSnapshot();
        if (!snap.logs || snap.logs.length === 0) {
          adminSeedMockData();
        }
      }

      // Retroactively grant any deserved badges + back-pay +50 chalk per badge.
      runRetroBadgeAudit();

      if (cancelled) return;

      const flush = () => {
        if (saveTimer.current) { window.clearTimeout(saveTimer.current); saveTimer.current = null; }
        if (saveInFlight.current) return;
        if (!userIdRef.current) return;
        if (!pending.current.game && !pending.current.gyms) return;
        const uid = userIdRef.current;
        const activeSlot = slotRef.current;
        const payload: { updated_at: string; game?: any; gyms?: any } = {
          updated_at: new Date().toISOString(),
        };
        if (pending.current.game) payload.game = pending.current.game;
        if (pending.current.gyms) payload.gyms = pending.current.gyms;
        pending.current = {};
        saveInFlight.current = true;
        (async () => {
          const expectedUpdatedAt = lastRemoteUpdatedAt.current;
          if (expectedUpdatedAt) {
            const { data: saved, error } = await supabase
              .from("user_game_state")
              .update(payload)
              .eq("user_id", uid)
              .eq("slot", activeSlot)
              .eq("updated_at", expectedUpdatedAt)
              .select("updated_at")
              .maybeSingle();

            if (error) throw error;

            if (!saved) {
              const { data: remote, error: fetchError } = await supabase
                .from("user_game_state")
                .select("game, gyms, updated_at")
                .eq("user_id", uid)
                .eq("slot", activeSlot)
                .maybeSingle();
              if (fetchError) throw fetchError;
              if (remote) {
                lastRemoteUpdatedAt.current = remote.updated_at ?? null;
                replaceGameState((remote.game ?? {}) as unknown as GameState);
                replaceGymsState((remote.gyms ?? {}) as unknown as GymState);
              }
              return;
            }

            lastRemoteUpdatedAt.current = saved.updated_at ?? payload.updated_at;
            return;
          }

          const { data: saved, error } = await supabase
            .from("user_game_state")
            .upsert({ user_id: uid, slot: activeSlot, ...payload }, { onConflict: "user_id,slot" })
            .select("updated_at")
            .maybeSingle();
          if (error) throw error;
          lastRemoteUpdatedAt.current = saved?.updated_at ?? payload.updated_at;
        })()
          .catch((error) => {
            console.warn("[sync] save failed", error instanceof Error ? error.message : error);
          })
          .finally(() => {
            saveInFlight.current = false;
            if (pending.current.game || pending.current.gyms) flush();
          });
      };
      flushRef.current = flush;

      const schedule = () => {
        // Persist immediately for every signed-in user/slot. The old debounce
        // could lose quick strength logs if the modal/page closed too soon.
        flush();
      };

      bindGameRemoteSync(s => { pending.current.game = s; schedule(); });
      bindGymsRemoteSync(s => { pending.current.gyms = s; schedule(); });
    })();

    return () => {
      cancelled = true;
      // Flush any queued writes before tearing down (slot switch / sign-out
      // / unmount) so recent logs aren't dropped with the debounce timer.
      flushRef.current?.();
      flushRef.current = null;
      if (saveTimer.current) { window.clearTimeout(saveTimer.current); saveTimer.current = null; }
      bindGameRemoteSync(null);
      bindGymsRemoteSync(null);
    };
  }, [user?.id, hasAdminRole, slot]);

  return null;
}
