// Hangboard session reward: writes into the existing strengthSessions array on
// user_game_state.game so the rolling 7-day "holds" tier picks it up, and tags
// the entry as kind:"hangboard" so the dashboard can chart it separately.

import { BASE_CHALK } from "@/game/data";
import { useGameStore } from "@/game/store";

export interface HangboardSessionEntry {
  kind: "hangboard";
  workoutId: string;
  workoutName: string;
  completedAt: number;
  totalHangSeconds: number;
  holds: { holdId: string; seconds: number }[];
}

/** Chalk awarded per second of completed hang. */
export const CHALK_PER_HANG_SECOND = BASE_CHALK.strength_rep; // 5

export function chalkForHangSeconds(seconds: number): number {
  return Math.round(seconds * CHALK_PER_HANG_SECOND);
}

/**
 * Persist a completed hangboard session into the game store.
 * Returns chalk awarded.
 */
export function commitHangboardSession(entry: Omit<HangboardSessionEntry, "kind">): number {
  const chalk = chalkForHangSeconds(entry.totalHangSeconds);
  const state = useGameStore.getState() as any;

  // Append the session to the same array the strength tier reads from.
  const full: HangboardSessionEntry = { ...entry, kind: "hangboard" };
  if (typeof state.recordStrengthSession === "function") {
    state.recordStrengthSession(full);
  } else {
    // Fallback: mutate directly if the store doesn't expose a helper.
    useGameStore.setState((s: any) => ({
      ...s,
      strengthSessions: [...(s.strengthSessions ?? []), full],
    }));
  }

  // Award chalk via whichever helper the store exposes.
  if (typeof state.addChalk === "function") state.addChalk(chalk, "hangboard");
  else if (typeof state.addCurrency === "function") state.addCurrency(chalk);
  else {
    useGameStore.setState((s: any) => ({
      ...s,
      chalk: (s.chalk ?? 0) + chalk,
      totalChalkEarned: (s.totalChalkEarned ?? 0) + chalk,
    }));
  }

  return chalk;
}
