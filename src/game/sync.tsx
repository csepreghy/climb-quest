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

/**
 * Mounts once. Loads the user's saved game + gyms state from the backend on
 * sign-in, and debounce-saves all subsequent changes back. When signed out,
 * we leave local state alone (localStorage still works as a fallback).
 */
export function GameSync() {
  const { user } = useAuth();
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
        // No remote row yet — push current local state up so it's preserved.
        await supabase.from("user_game_state").upsert({
          user_id: uid,
          game: getGameStateSnapshot() as any,
          gyms: getGymsSnapshot() as any,
        });
      }

      if (cancelled) return;

      const flush = () => {
        if (!userIdRef.current) return;
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
  }, [user?.id]);

  return null;
}
