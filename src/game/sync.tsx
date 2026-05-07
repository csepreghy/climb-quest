import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  bindGameRemoteSync,
  getGameStateSnapshot,
  replaceGameState,
  adminSeedMockData,
  State as GameState,
} from "./store";
import {
  bindGymsRemoteSync,
  getGymsSnapshot,
  replaceGymsState,
  GymState,
} from "./gyms";
import { getActiveSlot, useActiveSlot } from "./adminAccounts";

/**
 * Mounts once. Loads the user's saved game + gyms state from the backend on
 * sign-in, and debounce-saves all subsequent changes back. When signed out,
 * we leave local state alone (localStorage still works as a fallback).
 *
 * Admin accounts have two slots: "test" (synced to backend) and "personal"
 * (local-only). Switching slots re-runs this loader.
 */
export function GameSync() {
  const { user, isAdmin } = useAuth();
  const slot = useActiveSlot(user?.id ?? null);
  const userIdRef = useRef<string | null>(null);
  const saveTimer = useRef<number | null>(null);
  const pending = useRef<{ game?: GameState; gyms?: GymState }>({});

  useEffect(() => {
    const uid = user?.id ?? null;
    userIdRef.current = uid;

    if (!uid) {
      bindGameRemoteSync(null);
      bindGymsRemoteSync(null);
      return;
    }

    // Personal slot: local-only. Load from localStorage personal blob.
    if (isAdmin && slot === "personal") {
      bindGameRemoteSync(null);
      bindGymsRemoteSync(null);
      // Personal blob is saved/loaded by switchToSlot in adminAccounts.ts.
      // Persist any further changes to that blob.
      const persistKey = `climbquest:admin:slot:personal:${uid}`;
      const writeBlob = () => {
        try {
          localStorage.setItem(persistKey, JSON.stringify({
            game: getGameStateSnapshot(),
            gyms: getGymsSnapshot(),
          }));
        } catch {}
      };
      bindGameRemoteSync(() => writeBlob());
      bindGymsRemoteSync(() => writeBlob());
      return () => {
        bindGameRemoteSync(null);
        bindGymsRemoteSync(null);
      };
    }

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("user_game_state")
        .select("game, gyms")
        .eq("user_id", uid)
        .maybeSingle();

      if (cancelled) return;

      if (!error && data) {
        const game = data.game as unknown as GameState | Record<string, never>;
        const gyms = data.gyms as unknown as GymState | Record<string, never>;
        if (game && Object.keys(game).length) replaceGameState(game as GameState);
        if (gyms && Object.keys(gyms).length) replaceGymsState(gyms as GymState);
      } else {
        await supabase.from("user_game_state").upsert({
          user_id: uid,
          game: getGameStateSnapshot() as any,
          gyms: getGymsSnapshot() as any,
        });
      }

      if (isAdmin) {
        const snap = getGameStateSnapshot();
        if (!snap.logs || snap.logs.length === 0) {
          adminSeedMockData();
        }
      }

      if (cancelled) return;

      const flush = () => {
        if (!userIdRef.current) return;
        if (getActiveSlot(userIdRef.current) === "personal") return;
        const payload: Record<string, any> = { user_id: userIdRef.current };
        if (pending.current.game) payload.game = pending.current.game;
        if (pending.current.gyms) payload.gyms = pending.current.gyms;
        pending.current = {};
        supabase.from("user_game_state").upsert(payload).then(({ error }) => {
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
  }, [user?.id, isAdmin, slot]);

  return null;
}
