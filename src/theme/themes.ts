// Independent theme axes: panel (boxes), background, header (top bar), and avatar stage.
// Each option sets a small subset of CSS variables, so they can be mixed freely.

export type ThemeOption = {
  id: string;
  name: string;
  swatch: string;     // CSS background value for the swatch dot
  vars: Record<string, string>;
};

/* -------- PANEL / BOX COLORS (20) -------- */
const panelVars = (h: number, s: number, l: number) => ({
  "--background": `${h} ${s}% ${l}%`,
  "--card": `${h} ${s + 2}% ${Math.max(l - 2, 2)}%`,
  "--popover": `${h} ${s + 2}% ${Math.max(l - 2, 2)}%`,
  "--secondary": `${h} ${s}% ${l + 4}%`,
  "--muted": `${h} ${s}% ${l + 4}%`,
  "--input": `${h} ${s}% ${l}%`,
  "--border": `${h} ${s + 10}% ${Math.max(l - 6, 2)}%`,
  "--panel-frame": `${h} ${s + 20}% ${Math.max(l - 8, 2)}%`,
  "--panel-edge": `${h} ${s}% ${l + 10}%`,
  "--panel-fill": `${h} ${s + 2}% ${Math.max(l - 2, 2)}%`,
  "--panel-inset-light": `${h} 30% 92% / 0.06`,
  "--panel-inset-dark": `${h} 50% 2% / 0.85`,
  "--foreground": l > 55 ? `${h} 30% 12%` : `40 30% 94%`,
  "--card-foreground": l > 55 ? `${h} 30% 12%` : `40 30% 94%`,
  "--popover-foreground": l > 55 ? `${h} 30% 12%` : `40 30% 94%`,
  "--secondary-foreground": l > 55 ? `${h} 30% 12%` : `40 30% 94%`,
  "--muted-foreground": l > 55 ? `${h} 20% 30%` : `30 10% 72%`,
});

const panel = (id: string, name: string, swatch: string, h: number, s: number, l: number): ThemeOption =>
  ({ id, name, swatch, vars: panelVars(h, s, l) });

export const BOX_THEMES: ThemeOption[] = [
  // Dark
  panel("midnight",  "Midnight",   "#0e1422", 222, 30,  9),
  panel("slate",     "Slate",      "#1a1d24", 220, 10, 11),
  panel("graphite",  "Graphite",   "#16181a", 210,  6,  9),
  panel("obsidian",  "Obsidian",   "#0a0b0f", 230, 20,  6),
  panel("ink",       "Ink",        "#0d1218", 210, 25,  8),
  panel("storm",     "Storm",      "#15202b", 205, 30, 12),
  panel("teal-deep", "Deep Teal",  "#0f1f23", 188, 35, 10),
  panel("forest",    "Pine",       "#0f1a16", 158, 25, 10),
  panel("plum",      "Cold Plum",  "#181321", 265, 25, 10),
  panel("steel",     "Steel",      "#1c2128", 215, 15, 13),
  // Mid
  panel("espresso",  "Espresso",   "#3a2a22",  20, 30, 18),
  panel("oxblood",   "Oxblood",    "#3a1820",  350, 40, 16),
  panel("moss",      "Moss",       "#2a3a24",  100, 25, 18),
  // Pastel / light
  panel("paper",     "Paper",      "#f5efe2",  40,  40, 92),
  panel("cream",     "Cream",      "#fbf3df",  44,  60, 92),
  panel("mint",      "Mint",       "#dff3e6",  140, 40, 91),
  panel("sky-pale",  "Pale Sky",   "#dceaf5",  205, 50, 91),
  panel("blush",     "Blush",      "#f5dde2",  350, 50, 91),
  panel("lilac",     "Lilac",      "#e6dff5",  265, 40, 92),
  panel("sand",      "Sand",       "#ebdcc0",  38,  45, 84),
];

/* -------- BACKGROUND (20: 10 pastel solids + 10 gradients) -------- */
const bgSolid = (id: string, name: string, hex: string, hsl: string): ThemeOption => ({
  id, name, swatch: hex,
  vars: { "--bg-from": hsl, "--bg-to": hsl },
});
const bgGrad = (id: string, name: string, fromHex: string, toHex: string, from: string, to: string): ThemeOption => ({
  id, name, swatch: `linear-gradient(135deg,${fromHex},${toHex})`,
  vars: { "--bg-from": from, "--bg-to": to },
});

export const BG_THEMES: ThemeOption[] = [
  // 10 NEW pastel solid backgrounds
  bgSolid("p-peach",   "Pastel Peach",    "#ffd9b8", "26 100% 86%"),
  bgSolid("p-mint",    "Pastel Mint",     "#c8efd6", "140 55% 86%"),
  bgSolid("p-sky",     "Pastel Sky",      "#bfdcef", "205 65% 84%"),
  bgSolid("p-lavender","Pastel Lavender", "#d9cfee", "265 50% 87%"),
  bgSolid("p-rose",    "Pastel Rose",     "#f4cad4", "348 70% 87%"),
  bgSolid("p-butter",  "Pastel Butter",   "#fbecb0", "50 90% 84%"),
  bgSolid("p-pistach", "Pastel Pistachio","#dbe8a8", "70 50% 78%"),
  bgSolid("p-coral",   "Pastel Coral",    "#f6c2b1", "12 80% 84%"),
  bgSolid("p-turquoise","Pastel Turquoise","#b5e6e0", "175 50% 81%"),
  bgSolid("p-sand",    "Pastel Sand",     "#ecdcb8", "40 60% 83%"),
  // 10 gradients
  bgGrad("g-sunset", "Sunset Crag", "#8e3c4b", "#ecc979", "351 38% 41%", "40 75% 69%"),
  bgGrad("g-dawn",   "Alpine Dawn", "#7aa6d6", "#f0c4d6", "210 60% 70%", "330 55% 82%"),
  bgGrad("g-mist",   "Granite Mist","#7e8a92", "#b9cdd0", "210 12% 55%", "190 20% 78%"),
  bgGrad("g-ridge",  "Forest Ridge","#3f8a64", "#e6e3a3", "150 35% 38%", "60 55% 78%"),
  bgGrad("g-dusk",   "Desert Dusk", "#e08858", "#9667b3", "18 75% 58%",  "280 40% 55%"),
  bgGrad("g-ocean",  "Ocean Depth", "#2c8cc4", "#9bd6dd", "200 70% 50%", "188 55% 75%"),
  bgGrad("g-sky",    "Lavender Sky","#b58cdb", "#f4a8c8", "270 55% 70%", "330 70% 82%"),
  bgGrad("g-volcano","Volcanic",    "#c4332a", "#f29a3a", "0 70% 45%",   "30 90% 60%"),
  bgGrad("g-frost",  "Mint Frost",  "#7fdcb8", "#bfe4f2", "160 55% 70%", "200 60% 88%"),
  bgGrad("g-plum",   "Royal Plum",  "#e9b13a", "#7a3f8c", "42 80% 60%",  "285 45% 35%"),
];

/* -------- HEADER / TOP BAR (20) — color only; opacity is separate -------- */
const header = (id: string, name: string, hex: string, value: string): ThemeOption => ({
  id, name, swatch: hex, vars: { "--topbar-color": value },
});

export const HEADER_THEMES: ThemeOption[] = [
  header("h-ink",       "Ink",         "#0d1218", "210 25% 8%"),
  header("h-midnight",  "Midnight",    "#0e1422", "222 30% 9%"),
  header("h-graphite",  "Graphite",    "#16181a", "210 6% 9%"),
  header("h-espresso",  "Espresso",    "#2a1a12", "20 40% 10%"),
  header("h-oxblood",   "Oxblood",     "#3a1820", "350 40% 14%"),
  header("h-pine",      "Pine",        "#0f1a16", "158 25% 9%"),
  header("h-deep-teal", "Deep Teal",   "#0f1f23", "188 35% 10%"),
  header("h-plum",      "Plum",        "#181321", "265 25% 10%"),
  header("h-stone",     "Stone",       "#5a554f", "30 6% 32%"),
  header("h-clay",      "Clay",        "#8a4a3a", "12 40% 38%"),
  header("h-olive",     "Olive",       "#5a6a3a", "75 30% 32%"),
  header("h-navy",      "Navy",        "#1f3658", "215 50% 24%"),
  header("h-orange",    "Orange",      "#e8843a", "22 80% 56%"),
  header("h-crimson",   "Crimson",     "#b83048", "350 60% 45%"),
  header("h-emerald",   "Emerald",     "#2c8a5a", "150 50% 36%"),
  header("h-paper",     "Paper",       "#f5efe2", "40 40% 92%"),
  header("h-cream",     "Cream",       "#fbf3df", "44 60% 92%"),
  header("h-blush",     "Blush",       "#f5dde2", "350 50% 91%"),
  header("h-sky",       "Pale Sky",    "#dceaf5", "205 50% 91%"),
  header("h-mint",      "Mint",        "#dff3e6", "140 40% 91%"),
];

/* -------- AVATAR STAGE -------- */
const stage = (id: string, name: string, swatch: string, value: string): ThemeOption => ({
  id, name, swatch, vars: { "--avatar-stage": value },
});

export const STAGE_THEMES: ThemeOption[] = [
  stage("none",       "None",        "transparent",
        "transparent"),
  stage("soft-cream", "Soft Cream",  "#fbf3df",
        "linear-gradient(180deg, hsl(44 70% 95%), hsl(40 50% 86%))"),
  stage("paper",      "Paper",       "#f5efe2", "hsl(40 40% 92%)"),
  stage("sky-fade",   "Sky Fade",    "#cfe4f4",
        "linear-gradient(180deg, hsl(200 70% 92%), hsl(210 50% 78%))"),
  stage("sunrise",    "Sunrise",     "#fbd6b8",
        "linear-gradient(180deg, hsl(40 95% 88%), hsl(20 80% 78%))"),
  stage("meadow",     "Meadow",      "#cfe9c2",
        "linear-gradient(180deg, hsl(110 55% 88%), hsl(140 40% 72%))"),
  stage("dusk",       "Dusk",        "#a89bd6",
        "linear-gradient(180deg, hsl(260 50% 78%), hsl(290 40% 60%))"),
  stage("chalkboard", "Chalkboard",  "#1a2230",
        "linear-gradient(180deg, hsl(220 25% 18%), hsl(220 30% 10%))"),
  stage("cave",       "Cave",        "#2a221c",
        "radial-gradient(circle at 50% 35%, hsl(30 25% 22%), hsl(20 30% 8%))"),
  stage("spotlight",  "Spotlight",   "#caa040",
        "radial-gradient(circle at 50% 40%, hsl(42 90% 70%), hsl(28 60% 35%))"),
  stage("rock",       "Rock Wall",   "#7a6a58",
        "linear-gradient(180deg, hsl(28 18% 55%), hsl(22 22% 32%))"),
  stage("sunset",     "Sunset",      "#e08858",
        "linear-gradient(180deg, hsl(28 90% 72%), hsl(350 60% 50%))"),
];

/* -------- CHARACTER GLOW -------- */
const glow = (id: string, name: string, swatch: string, color: string, intensity = "0.7"): ThemeOption => ({
  id, name, swatch,
  vars: { "--avatar-glow-color": color, "--avatar-glow-opacity": intensity },
});

export const GLOW_THEMES: ThemeOption[] = [
  glow("none",      "None",       "transparent",      "transparent",   "0"),
  glow("gold",      "Gold",       "#ffd76a",          "42 100% 65%",   "0.75"),
  glow("amber",     "Amber",      "#ff9a3a",          "28 100% 60%",   "0.75"),
  glow("crimson",   "Crimson",    "#ff5a6a",          "354 90% 62%",   "0.7"),
  glow("emerald",   "Emerald",    "#4ade80",          "142 70% 55%",   "0.7"),
  glow("aqua",      "Aqua",       "#5fd6ff",          "195 95% 65%",   "0.7"),
  glow("violet",    "Violet",     "#a87aff",          "260 90% 70%",   "0.7"),
  glow("magenta",   "Magenta",    "#ff5ad8",          "315 95% 65%",   "0.7"),
  glow("white",     "Holy White", "#ffffff",          "0 0% 100%",     "0.7"),
  glow("rainbow",   "Rainbow",    "linear-gradient(135deg,#ff5a6a,#ffd76a,#4ade80,#5fd6ff,#a87aff)",
                                                       "var(--accent)", "0"),
];

/* -------- DEFAULTS -------- */
export const DEFAULTS = {
  box: "midnight",
  bg: "g-sunset",
  header: "h-ink",
  stage: "soft-cream",
  glow: "gold",
};

