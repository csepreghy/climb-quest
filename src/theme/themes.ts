// Dark panel themes — only affects boxes/panels/cards, not the bright background or buttons.
// Values are HSL strings (without the hsl() wrapper) for CSS custom properties.

export type PanelTheme = {
  id: string;
  name: string;
  swatch: string; // hex preview for the swatch dot
  vars: {
    "--background": string;
    "--card": string;
    "--popover": string;
    "--secondary": string;
    "--muted": string;
    "--input": string;
    "--border": string;
    "--panel-frame": string;
    "--panel-edge": string;
    "--panel-fill": string;
    "--panel-inset-light": string;
    "--panel-inset-dark": string;
  };
};

const make = (
  id: string,
  name: string,
  swatch: string,
  h: number,
  s: number,
  l: number,
): PanelTheme => ({
  id,
  name,
  swatch,
  vars: {
    "--background": `${h} ${s}% ${l}%`,
    "--card": `${h} ${s + 2}% ${l - 2}%`,
    "--popover": `${h} ${s + 2}% ${l - 2}%`,
    "--secondary": `${h} ${s}% ${l + 4}%`,
    "--muted": `${h} ${s}% ${l + 4}%`,
    "--input": `${h} ${s}% ${l}%`,
    "--border": `${h} ${s + 10}% ${Math.max(l - 6, 2)}%`,
    "--panel-frame": `${h} ${s + 20}% ${Math.max(l - 8, 2)}%`,
    "--panel-edge": `${h} ${s}% ${l + 10}%`,
    "--panel-fill": `${h} ${s + 2}% ${l - 2}%`,
    "--panel-inset-light": `${h} 30% 92% / 0.06`,
    "--panel-inset-dark": `${h} 50% 2% / 0.85`,
  },
});

export const PANEL_THEMES: PanelTheme[] = [
  make("midnight",  "Midnight",     "#0e1422", 222, 30,  9),
  make("slate",     "Slate",        "#1a1d24", 220, 10, 11),
  make("graphite",  "Graphite",     "#16181a", 210,  6,  9),
  make("obsidian",  "Obsidian",     "#0a0b0f", 230, 20,  6),
  make("ink",       "Ink",          "#0d1218", 210, 25,  8),
  make("storm",     "Storm",        "#15202b", 205, 30, 12),
  make("teal-deep", "Deep Teal",    "#0f1f23", 188, 35, 10),
  make("forest",    "Pine",         "#0f1a16", 158, 25, 10),
  make("plum",      "Cold Plum",    "#181321", 265, 25, 10),
  make("steel",     "Steel",        "#1c2128", 215, 15, 13),
];

export const DEFAULT_THEME_ID = "midnight";
