// Hold geometry for the Beastmaker 1000 overlay.
// Coordinates are percentages (0-100) relative to the image bounding box.
// Tuned against src/assets/hangboard-beastmaker1000.jpg.

export type HoldType = "sloper" | "jug" | "edge" | "pocket" | "mono";

export interface HangboardHold {
  id: string;
  label: string;
  type: HoldType;
  sizeMm?: number;
  /** Bounding box in % of the board image. */
  x: number;
  y: number;
  w: number;
  h: number;
}

export const BEASTMAKER_1000_HOLDS: HangboardHold[] = [
  // Top row — two large jugs / slopers
  { id: "jug_l",     label: "Big Jug L",     type: "jug",                x: 12, y: 26, w: 30, h: 22 },
  { id: "jug_r",     label: "Big Jug R",     type: "jug",                x: 58, y: 26, w: 30, h: 22 },
  // Middle row — long edges
  { id: "edge_45",   label: "45mm Edge",     type: "edge", sizeMm: 45,   x: 26, y: 52, w: 22, h: 10 },
  { id: "edge_35",   label: "35mm Edge",     type: "edge", sizeMm: 35,   x: 52, y: 52, w: 22, h: 10 },
  // Small side pockets flanking the middle edges
  { id: "pocket_l",  label: "Pocket L",      type: "pocket",             x: 12, y: 56, w: 12, h: 9  },
  { id: "pocket_r",  label: "Pocket R",      type: "pocket",             x: 76, y: 56, w: 12, h: 9  },
  // Bottom row — 20mm edge centred between two monos
  { id: "mono_l",    label: "Mono L",        type: "mono",               x: 24, y: 72, w: 12, h: 12 },
  { id: "edge_20",   label: "20mm Edge",     type: "edge", sizeMm: 20,   x: 40, y: 72, w: 20, h: 12 },
  { id: "mono_r",    label: "Mono R",        type: "mono",               x: 64, y: 72, w: 12, h: 12 },
];

export const HOLD_BY_ID: Record<string, HangboardHold> = Object.fromEntries(
  BEASTMAKER_1000_HOLDS.map(h => [h.id, h])
);

export function holdLabel(id: string): string {
  return HOLD_BY_ID[id]?.label ?? id;
}
