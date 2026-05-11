import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  bindGameRemoteSync,
  getGameStateSnapshot,
  replaceGameState,
  runRetroBadgeAudit,
  State as GameState,
} from "./store";
import {
  bindGymsRemoteSync,
  getGymsSnapshot,
  replaceGymsState,
  GymState,
} from "./gyms";

/**
 * Loads the user's game + gyms from the backend on sign-in, and persists changes
 * back to the same row. One row per user — no slot concept.
 */
export function GameSync() {
  const { user } = useAuth();
  const userIdRef = useRef<string | null>(null);
  const saveInFlight = useRef(false);
  const lastRemoteUpdatedAt = useRef<string | null>(null);
  const remoteHadContent = useRef(false);
  const pending = useRef<{ game?: GameState; gyms?: GymState }>({});
  const flushRef = useRef<(() => void) | null>(null);

  const looksPopulated = (g: any): boolean => {
    if (!g || typeof g !== "object") return false;
    if (Array.isArray(g.logs) && g.logs.length > 0) return true;
    if (Array.isArray(g.strengthSessions) && g.strengthSessions.length > 0) return true;
    if (typeof g.level === "number" && g.level > 1) return true;
    if (typeof g.totalChalkEarned === "number" && g.totalChalkEarned > 500) return true;
    if (Array.isArray(g.owned) && g.owned.length > 1) return true;
    return false;
  };

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
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error("[sync] load failed — skipping replace + write to avoid data loss", error);
        remoteHadContent.current = false;
        return;
      }

      if (data) {
        lastRemoteUpdatedAt.current = data.updated_at ?? null;
        const game = data.game as unknown as GameState | Record<string, never>;
        const gyms = data.gyms as unknown as GymState | Record<string, never>;
        remoteHadContent.current = looksPopulated(game);
        replaceGameState((game ?? {}) as GameState);
        replaceGymsState((gyms ?? {}) as GymState);
      } else {
        remoteHadContent.current = false;
        replaceGameState({} as GameState);
        replaceGymsState({} as GymState);
        const { data: inserted } = await supabase.from("user_game_state").upsert({
          user_id: uid,
          updated_at: new Date().toISOString(),
          game: getGameStateSnapshot() as any,
          gyms: getGymsSnapshot() as any,
        }, { onConflict: "user_id" }).select("updated_at").maybeSingle();
        lastRemoteUpdatedAt.current = inserted?.updated_at ?? null;
      }

      runRetroBadgeAudit();

      if (cancelled) return;

      const flush = () => {
        if (saveInFlight.current) return;
        if (!userIdRef.current) return;
        if (!pending.current.game && !pending.current.gyms) return;
        const uid = userIdRef.current;
        const payload: { updated_at: string; game?: any; gyms?: any } = {
          updated_at: new Date().toISOString(),
        };
        if (pending.current.game) payload.game = pending.current.game;
        if (pending.current.gyms) payload.gyms = pending.current.gyms;
        pending.current = {};

        if (payload.game && remoteHadContent.current && !looksPopulated(payload.game)) {
          console.error(
            "[sync] BLOCKED save: would overwrite populated remote with empty state",
            { uid: userIdRef.current }
          );
          return;
        }
        if (payload.game && looksPopulated(payload.game)) remoteHadContent.current = true;

        saveInFlight.current = true;
        (async () => {
          const expectedUpdatedAt = lastRemoteUpdatedAt.current;
          if (expectedUpdatedAt) {
            const { data: saved, error } = await supabase
              .from("user_game_state")
              .update(payload)
              .eq("user_id", uid)
              .eq("updated_at", expectedUpdatedAt)
              .select("updated_at")
              .maybeSingle();

            if (error) throw error;

            if (!saved) {
              const { data: remote, error: fetchError } = await supabase
                .from("user_game_state")
                .select("game, gyms, updated_at")
                .eq("user_id", uid)
                .maybeSingle();
              if (fetchError) throw fetchError;
              if (remote) {
                lastRemoteUpdatedAt.current = remote.updated_at ?? null;
                if (looksPopulated(remote.game)) remoteHadContent.current = true;
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
            .upsert({ user_id: uid, ...payload }, { onConflict: "user_id" })
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

      bindGameRemoteSync(s => { pending.current.game = s; flush(); });
      bindGymsRemoteSync(s => { pending.current.gyms = s; flush(); });
    })();

    return () => {
      cancelled = true;
      flushRef.current?.();
      flushRef.current = null;
      bindGameRemoteSync(null);
      bindGymsRemoteSync(null);
    };
  }, [user?.id]);

  return null;
}
