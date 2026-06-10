// Thin wrapper around the store helper so call sites can import from
// "@/game/hangboard/rewards" without reaching into the store directly.
import { logHangboardSession, type HangboardInput } from "@/game/store";
import { BASE_CHALK } from "@/game/data";

export const CHALK_PER_HANG_SECOND = BASE_CHALK.strength_rep; // 5

export function commitHangboardSession(input: HangboardInput) {
  return logHangboardSession(input);
}
