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
  const pending = useRef<{ game?: GameState; gyms?: GymState }>({});

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
        .select("game, gyms")
        .eq("user_id", uid)
        .eq("slot", slot)
        .maybeSingle();

      if (cancelled) return;

      if (!error && data) {
        const game = data.game as unknown as GameState | Record<string, never>;
        const gyms = data.gyms as unknown as GymState | Record<string, never>;
        // Always replace — empty object yields a fresh profile, which is what
        // a brand-new personal slot should look like.
        replaceGameState((game ?? {}) as GameState);
        replaceGymsState((gyms ?? {}) as GymState);
      } else {
        // No row yet for this slot — start fresh and create the row.
        replaceGameState({} as GameState);
        replaceGymsState({} as GymState);
        await supabase.from("user_game_state").upsert({
          user_id: uid,
          slot,
          game: getGameStateSnapshot() as any,
          gyms: getGymsSnapshot() as any,
        }, { onConflict: "user_id,slot" });
      }

      // Only seed mock data into the admin's TEST slot, never personal.
      if (hasAdminRole && slot === "test") {
        const snap = getGameStateSnapshot();
        if (!snap.logs || snap.logs.length === 0) {
          adminSeedMockData();
        }
      }

      if (cancelled) return;

      const flush = () => {
        if (!userIdRef.current) return;
        const payload: Record<string, any> = {
          user_id: userIdRef.current,
          slot: slotRef.current,
        };
        if (pending.current.game) payload.game = pending.current.game;
        if (pending.current.gyms) payload.gyms = pending.current.gyms;
        pending.current = {};
        supabase
          .from("user_game_state")
          .upsert(payload, { onConflict: "user_id,slot" })
          .then(({ error }) => {
            if (error) console.warn("[sync] save failed", error.message);
          });
      };

      const schedule = () => {
        if (saveTimer.current) window.clearTimeout(saveTimer.current);
        saveTimer.current = window.setTimeout(flush, 600);
      };

      bindGameRemoteSync(s => { pending.current.game = s; schedule(); });
      bindGymsRemoteSync(s => { pending.current.gyms = s; schedule(); });
    })();

    return () => {
      cancelled = true;
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      bindGameRemoteSync(null);
      bindGymsRemoteSync(null);
    };
  }, [user?.id, hasAdminRole, slot]);

  return null;
}
