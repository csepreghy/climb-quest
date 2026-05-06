import type { SpriteDef } from "./PixelSprite";
import type { Gender } from "@/game/data";

/* ---------------- CLIMBER SPRITES ----------------
   16x16 pixel grid. Each level has its own design.
   Palette legend:
     S = skin, H = hair, T = top, B = bottoms, F = footwear
     C = chalk/accessory, E = eye, M = mouth, K = outline (dark)
     X = extra accent, A = aura/spark
*/

const skinTone = "#f4c9a3";
const dark = "#1a1410";

interface Climber {
  grid: string;
  basePalette: Record<string, string>;
}

// Helper to build per-gender variant palettes
const climberPalette = (
  top: string,
  bottoms: string,
  footwear: string,
  hair: string,
  accent = "#ffe27a",
): Record<string, string> => ({
  S: skinTone,
  H: hair,
  T: top,
  B: bottoms,
  F: footwear,
  C: "#f5efe0",
  E: dark,
  M: "#7a3a2a",
  K: dark,
  X: accent,
  A: "#fff8c4",
});

// All climbers share this body silhouette template; we vary palette + small accent.
// 16 rows x 12 cols
const baseBody = `
. . . . K K K K . . . .
. . . K H H H H K . . .
. . K H H H H H H K . .
. . K H S S S S H K . .
. . K S E S S E S K . .
. . K S S M M S S K . .
. . . K S S S S K . . .
. . K T T T T T T K . .
. K T T T T T T T T K .
. K T T C T T T T T K .
. K T T T T T T T T K .
. . K B B B B B B K . .
. . K B B B B B B K . .
. . K B B . . B B K . .
. . K F F . . F F K . .
. . K K K . . K K K . .
`;

// Variants per level (palette tweaks); some have a small "X" accent on top row
const climberSprites: Record<number, Climber> = {
  1: { grid: baseBody, basePalette: climberPalette("#7c5a3a", "#3a3a3a", "#5a4a3a", "#3a2a1a") },           // Rental Shoe Rookie - drab
  2: { grid: baseBody, basePalette: climberPalette("#4a8fc7", "#2a3a5a", "#7a5a3a", "#4a3a2a") },           // Chalk Chaser - blue tee
  3: { grid: baseBody, basePalette: climberPalette("#3aa86a", "#3a3a4a", "#3a3a3a", "#3a2a1a") },           // Footwork Fiend - green
  4: { grid: baseBody, basePalette: climberPalette("#d97a3a", "#5a3a2a", "#3a2a1a", "#5a3a1a", "#ffd24a") },// Jug Juggler - orange
  5: { grid: baseBody, basePalette: climberPalette("#c74a7a", "#3a2a4a", "#7a3a3a", "#1a1a1a", "#f5efe0") },// Cute Crimper - pink
  6: { grid: baseBody, basePalette: climberPalette("#e23a5a", "#1a3a7a", "#3a3a3a", "#3a2a1a", "#7aff7a") },// Dyno Devourer - bold red+neon
  7: { grid: baseBody, basePalette: climberPalette("#5a8a3a", "#3a4a2a", "#2a2a2a", "#2a3a1a", "#3aff7a") },// Board Goblin - greenish
  8: { grid: baseBody, basePalette: climberPalette("#3a3a5a", "#1a1a2a", "#3a2a1a", "#2a2a2a", "#7adfff") },// Beta Breaker - smart navy
  9: { grid: baseBody, basePalette: climberPalette("#7a3a3a", "#2a1a1a", "#1a1a1a", "#1a1a1a", "#ff7a3a") },// Project Beast - dark red
  10:{ grid: baseBody, basePalette: climberPalette("#1a1a2a", "#1a1a1a", "#caa040", "#1a1a1a", "#ffe27a") },// Crimp Demigod - gold accents
};

// Gender tweak: subtle visual variant.
// female -> longer hair pixels above shoulders (simulate by extending H one row down on sides)
// male -> shorter (default)
// neutral -> default
function applyGender(grid: string, gender: Gender): string {
  if (gender !== "female") return grid;
  const rows = grid.split("\n");
  // Modify row index 7 (top of shirt area), inject hair pixels at cols 1 and 10
  // Find the row that starts with ". K T T..." (shoulders)
  return rows
    .map(r => {
      if (/^\.\sK\sT/.test(r.trim())) {
        // ". K T T T T T T K ." -> "K H T T T T T T H K"
        return r.replace(". K T T T T T T K .", "K H T T T T T T H K");
      }
      return r;
    })
    .join("\n");
}

export function getClimberSprite(level: number, gender: Gender): SpriteDef {
  const c = climberSprites[level] ?? climberSprites[1];
  return { grid: applyGender(c.grid, gender), palette: c.basePalette };
}

/* ---------------- BOSS SPRITES ---------------- */

export const BOSS_SPRITES: Record<string, SpriteDef> = {
  // Slab Menace - stoic stone head
  v5_slab: {
    grid: `
. . K K K K K K K K . .
. K G G G G G G G G K .
K G G D G G G G D G G K
K G G G G G G G G G G K
K G G G G G G G G G G K
K G G R R G G R R G G K
K G G R W G G R W G G K
K G G G G G G G G G G K
K G G G G K K G G G G K
K G G G K K K K G G G K
. K G G G G G G G G K .
. . K K K K K K K K . .
`,
    palette: { G: "#7a8a8a", D: "#4a5a5a", R: "#e23a3a", W: "#fff3c4", K: dark },
  },
  // Overhang Goblin - green grin
  "6bplus_over": {
    grid: `
. . . K K K K K K . . .
. . K G G G G G G K . .
. K G G G G G G G G K .
. K G W W G G W W G K .
. K G W K G G W K G K .
. K G G G G G G G G K .
. K G G K K K K G G K .
. K G K W W W W K G K .
. . K K T T T T K K . .
. . . . T K K T . . . .
. . . . . . . . . . . .
. . . . . . . . . . . .
`,
    palette: { G: "#5aa848", W: "#fff", T: "#fff", K: dark },
  },
  // MoonBoard Demon - red devil
  moonboard_dem: {
    grid: `
. . K . . . . . . K . .
. K R K . . . . K R K .
K R R R K K K K R R R K
K R R R R R R R R R R K
K R Y R R R R R R Y R K
K R Y R K R R K R Y R K
K R R R R R R R R R R K
K R R K K K K K K R R K
. K R R W W W W R R K .
. . K R R R R R R K . .
. . . K K K K K K . . .
. . . . . . . . . . . .
`,
    palette: { R: "#c0303a", Y: "#ffd83a", W: "#fff", K: dark },
  },
  // Coordination Paddle Dyno - swirly blue
  coord_paddle: {
    grid: `
. . . K K K K K K . . .
. . K B B B B B B K . .
. K B B C C C C B B K .
. K B C B B B B C B K .
. K B C B Y Y B C B K .
. K B C B Y Y B C B K .
. K B C B B B B C B K .
. K B B C C C C B B K .
. . K B B B B B B K . .
. . . K K K K K K . . .
`,
    palette: { B: "#3a7adf", C: "#7adfff", Y: "#ffd83a", K: dark },
  },
  // Compression Cave Beast - bear-ish
  comp_cave: {
    grid: `
. K K . . . . . . K K .
K B B K . . . . K B B K
K B B B K K K K B B B K
K B B B B B B B B B B K
K B W B B B B B B W B K
K B W B K B B K B W B K
K B B B B B B B B B B K
K B B B Y Y Y Y B B B K
. K B B B B B B B B K .
. . K B B B B B B K . .
. . . K K K K K K . . .
`,
    palette: { B: "#6b4a2a", W: "#fff", Y: "#fff3c4", K: dark },
  },
  // Tiny Crimp Nightmare - ghost
  tiny_crimp: {
    grid: `
. . K K K K K K K K . .
. K W W W W W W W W K .
K W W W W W W W W W W K
K W W K W W W W K W W K
K W W K W W W W K W W K
K W W W W W W W W W W K
K W W W K K K K W W W K
K W W W W W W W W W W K
. K W K W K W K W K W K
. . . . . . . . . . . .
`,
    palette: { W: "#e8e8ff", K: dark },
  },
};

export function getBossSprite(idOrName: string): SpriteDef {
  // Boss IDs in store look like "v5_slab-abc12" — strip suffix
  const baseKey = idOrName.split("-")[0];
  return BOSS_SPRITES[baseKey] ?? BOSS_SPRITES.v5_slab;
}

/* ---------------- ITEM ICONS (small) ---------------- */

export const ITEM_SPRITES: Record<string, SpriteDef> = {
  shoes: {
    grid: `
. . . . . . . .
. . R R R R . .
. R R R R R R .
R R W W W R R R
R W W W W R R R
. R R R R R R .
. . . . . . . .
`,
    palette: { R: "#c4434a", W: "#fff" },
  },
  chalk_bag: {
    grid: `
. . K K K K . .
. K W W W W K .
K W W W W W W K
K W W C C W W K
K W W W W W W K
K W W W W W W K
. K W W W W K .
. . K K K K . .
`,
    palette: { W: "#f5efe0", C: "#cfc8b0", K: "#3a2a1a" },
  },
  brush: {
    grid: `
. . . . . . . K
. . . . . . K B
. . . . . K B B
. . . . K B B .
. . . W B B . .
. . W W B . . .
. W W W . . . .
W W W . . . . .
`,
    palette: { W: "#f5efe0", B: "#7a4a2a", K: "#3a2a1a" },
  },
  crocs: {
    grid: `
. . . . . . . .
. Y Y Y Y Y Y .
Y Y D Y Y D Y Y
Y Y Y Y Y Y Y Y
. Y Y Y Y Y Y .
. . . . . . . .
`,
    palette: { Y: "#f5c43a", D: "#a07a1a" },
  },
  magdust: {
    grid: `
. . . A . . . .
. A . . . A . .
. . . S S . . .
. . S W S . . .
. . S W S . . .
. . . S S . . .
. A . . . A . .
. . . A . . . .
`,
    palette: { S: "#c8b4ff", W: "#fff", A: "#ffeac4" },
  },
};

/* ---------------- BACKGROUND TILES ---------------- */

// Bouldering hold sprite (used scattered in background)
export const HOLD_SPRITE: SpriteDef = {
  grid: `
. . K K K . .
. K H H H K .
K H H D H H K
K H D H H H K
. K H H H K .
. . K K K . .
`,
  palette: { H: "#5a4a3a", D: "#3a2a1a", K: "#1a1410" },
};
