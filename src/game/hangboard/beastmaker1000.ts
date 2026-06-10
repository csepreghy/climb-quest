// Hold geometry for the Beastmaker 1000 overlay.
// Coordinates are percentages (0-100) relative to the image.
// x, y = top-left corner of the hit-box; w, h = size.
// These are tuned against src/assets/hangboard-beastmaker1000.jpg and may need
// a small nudge after the image is generated.

export type HoldType = "sloper" | "jug" | "edge" | "pocket" | "mono";

export interface HangboardHold {
  id: string;
  label: string;
  type: HoldType;
  /** Edge depth in mm; undefined for slopers/jugs. */
  sizeMm?: number;
  /** Bounding box in % of the board image. */
  x: number;
  y: number;
  w: number;
  h: number;
}

export const BEASTMAKER_1000_HOLDS: HangboardHold[] = [
  // Top row – slopers (corners)
  { id: "sloper_l",  label: "Sloper L",       type: "sloper", x: 4,  y: 6,  w: 18, h: 18 },
  { id: "sloper_r",  label: "Sloper R",       type: "sloper", x: 78, y: 6,  w: 18, h: 18 },
  // Jugs flanking center top
  { id: "jug_l",     label: "Jug L",          type: "jug",    x: 26, y: 8,  w: 18, h: 14 },
  { id: "jug_r",     label: "Jug R",          type: "jug",    x: 56, y: 8,  w: 18, h: 14 },

  // Middle row – flat edges
  { id: "edge_35_l", label: "35mm Edge L",    type: "edge", sizeMm: 35, x: 8,  y: 36, w: 18, h: 10 },
  { id: "edge_45",   label: "45mm Edge",      type: "edge", sizeMm: 45, x: 36, y: 34, w: 28, h: 12 },
  { id: "edge_35_r", label: "35mm Edge R",    type: "edge", sizeMm: 35, x: 74, y: 36, w: 18, h: 10 },

  // Lower row – pockets
  { id: "pocket_4_l",  label: "4-finger Pocket L", type: "pocket", x: 12, y: 58, w: 14, h: 10 },
  { id: "pocket_3_l",  label: "3-finger Pocket L", type: "pocket", x: 30, y: 60, w: 12, h: 9 },
  { id: "pocket_3_r",  label: "3-finger Pocket R", type: "pocket", x: 58, y: 60, w: 12, h: 9 },
  { id: "pocket_4_r",  label: "4-finger Pocket R", type: "pocket", x: 74, y: 58, w: 14, h: 10 },

  // Bottom – small edges + mono
  { id: "edge_20_l", label: "20mm Edge L",  type: "edge", sizeMm: 20, x: 18, y: 78, w: 14, h: 8 },
  { id: "edge_20",   label: "20mm Edge",    type: "edge", sizeMm: 20, x: 43, y: 80, w: 14, h: 8 },
  { id: "edge_20_r", label: "20mm Edge R",  type: "edge", sizeMm: 20, x: 68, y: 78, w: 14, h: 8 },
  { id: "mono_l",    label: "Mono L",       type: "mono",             x: 35, y: 92, w: 6,  h: 5 },
  { id: "mono_r",    label: "Mono R",       type: "mono",             x: 59, y: 92, w: 6,  h: 5 },
];

export const HOLD_BY_ID: Record<string, HangboardHold> = Object.fromEntries(
  BEASTMAKER_1000_HOLDS.map(h => [h.id, h])
);

export function holdLabel(id: string): string {
  return HOLD_BY_ID[id]?.label ?? id;
}
