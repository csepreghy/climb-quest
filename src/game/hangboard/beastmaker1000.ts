// Hold geometry for the Beastmaker 1000 cartoon overlay.
// Coordinates are percentages (0-100) relative to the 1920x640 board image.
// Most holds are mirrored pairs; each logical hold owns 1-2 physical positions
// so hovering/highlighting lights up both sides at once.

export type HoldType = "edge" | "pocket" | "mono" | "sloper" | "jug";

export interface HoldPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface HangboardHold {
  id: string;
  /** Short display label, e.g. "20mm Edge". */
  label: string;
  /** Number from the Beastmaker 1000 reference card (1-9). */
  number: number;
  type: HoldType;
  sizeMm?: number;
  /** One position for centre holds, two for mirrored pairs. */
  positions: HoldPosition[];
}

// --- Row Y / H constants ---
const TOP_Y = 24, TOP_H = 14;
const MID_Y = 42, MID_H = 16;
const BOT_Y = 63, BOT_H = 16;

export const BEASTMAKER_1000_HOLDS: HangboardHold[] = [
  // Top row
  {
    id: "n1", number: 1, label: "15mm Edge", type: "edge", sizeMm: 15,
    positions: [
      { x: 7,  y: TOP_Y, w: 11, h: TOP_H },
      { x: 82, y: TOP_Y, w: 11, h: TOP_H },
    ],
  },
  {
    id: "n2", number: 2, label: "30mm Edge", type: "edge", sizeMm: 30,
    positions: [
      { x: 33, y: TOP_Y, w: 9, h: TOP_H },
      { x: 58, y: TOP_Y, w: 9, h: TOP_H },
    ],
  },
  // Middle row
  {
    id: "n3", number: 3, label: "45mm Edge", type: "edge", sizeMm: 45,
    positions: [
      { x: 7,  y: MID_Y, w: 10, h: MID_H },
      { x: 83, y: MID_Y, w: 10, h: MID_H },
    ],
  },
  {
    id: "n4", number: 4, label: "2-finger 50mm Pocket", type: "pocket", sizeMm: 50,
    positions: [
      { x: 19, y: MID_Y, w: 10, h: MID_H },
      { x: 71, y: MID_Y, w: 10, h: MID_H },
    ],
  },
  {
    id: "n5", number: 5, label: "3-finger 45mm Pocket", type: "pocket", sizeMm: 45,
    positions: [
      { x: 31, y: MID_Y, w: 10, h: MID_H },
      { x: 59, y: MID_Y, w: 10, h: MID_H },
    ],
  },
  {
    id: "n6", number: 6, label: "50mm Edge", type: "edge", sizeMm: 50,
    positions: [
      { x: 43, y: MID_Y, w: 14, h: MID_H },
    ],
  },
  // Bottom row
  {
    id: "n7", number: 7, label: "20mm Edge", type: "edge", sizeMm: 20,
    positions: [
      { x: 7,  y: BOT_Y, w: 11, h: BOT_H },
      { x: 82, y: BOT_Y, w: 11, h: BOT_H },
    ],
  },
  {
    id: "n8", number: 8, label: "2-finger 25mm Pocket", type: "pocket", sizeMm: 25,
    positions: [
      { x: 19, y: BOT_Y, w: 11, h: BOT_H },
      { x: 70, y: BOT_Y, w: 11, h: BOT_H },
    ],
  },
  {
    id: "n9", number: 9, label: "3-finger 20mm Pocket", type: "pocket", sizeMm: 20,
    positions: [
      { x: 32, y: BOT_Y, w: 11, h: BOT_H },
      { x: 57, y: BOT_Y, w: 11, h: BOT_H },
    ],
  },
];

// Legacy id alias map — keeps old saved workouts rendering with the new holds.
const OLD_TO_NEW_ID: Record<string, string> = {
  jug_l: "n1", jug_r: "n1",
  edge_45: "n3",
  edge_35: "n2",
  pocket_l: "n8", pocket_r: "n8",
  mono_l: "n9", mono_r: "n9",
  edge_20: "n7",
};

const BASE_BY_ID: Record<string, HangboardHold> = Object.fromEntries(
  BEASTMAKER_1000_HOLDS.map(h => [h.id, h])
);

export const HOLD_BY_ID: Record<string, HangboardHold> = new Proxy(BASE_BY_ID, {
  get(target, key: string) {
    if (key in target) return target[key];
    const aliased = OLD_TO_NEW_ID[key];
    if (aliased) return target[aliased];
    return undefined;
  },
});

export function holdLabel(id: string): string {
  return HOLD_BY_ID[id]?.label ?? id;
}

export function resolveHoldId(id: string): string {
  return OLD_TO_NEW_ID[id] ?? id;
}
