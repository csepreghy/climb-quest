// Full palette themes — affects panels, background gradient, and top bar.
// All values are HSL strings without the hsl() wrapper.

export type PanelTheme = {
  id: string;
  name: string;
  swatch: string; // hex preview for the swatch dot (uses bg gradient)
  vars: Record<string, string>;
};

type ThemeInput = {
  id: string;
  name: string;
  // background gradient stops as "H S% L%"
  bgFrom: string;
  bgTo: string;
  // topbar color "H S% L% / a"
  topbar: string;
  // panel base hue+sat+light
  panel: { h: number; s: number; l: number };
  swatch: string;
};

const buildPanel = ({ h, s, l }: ThemeInput["panel"]) => ({
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
});

const make = (t: ThemeInput): PanelTheme => ({
  id: t.id,
  name: t.name,
  swatch: t.swatch,
  vars: {
    ...buildPanel(t.panel),
    "--bg-from": t.bgFrom,
    "--bg-to": t.bgTo,
    "--topbar-bg": t.topbar,
  },
});

export const PANEL_THEMES: PanelTheme[] = [
  make({
    id: "sunset-crag", name: "Sunset Crag",
    bgFrom: "351 38% 41%", bgTo: "40 75% 69%",
    topbar: "20 40% 8% / 0.85",
    panel: { h: 20, s: 14, l: 12 },
    swatch: "linear-gradient(135deg,#8e3c4b,#ecc979)",
  }),
  make({
    id: "alpine-dawn", name: "Alpine Dawn",
    bgFrom: "210 60% 70%", bgTo: "330 55% 82%",
    topbar: "222 30% 10% / 0.85",
    panel: { h: 222, s: 30, l: 9 },
    swatch: "linear-gradient(135deg,#7aa6d6,#f0c4d6)",
  }),
  make({
    id: "granite-mist", name: "Granite Mist",
    bgFrom: "210 12% 55%", bgTo: "190 20% 78%",
    topbar: "210 10% 10% / 0.85",
    panel: { h: 210, s: 10, l: 11 },
    swatch: "linear-gradient(135deg,#7e8a92,#b9cdd0)",
  }),
  make({
    id: "forest-ridge", name: "Forest Ridge",
    bgFrom: "150 35% 38%", bgTo: "60 55% 78%",
    topbar: "158 25% 8% / 0.85",
    panel: { h: 158, s: 25, l: 10 },
    swatch: "linear-gradient(135deg,#3f8a64,#e6e3a3)",
  }),
  make({
    id: "desert-dusk", name: "Desert Dusk",
    bgFrom: "18 75% 58%", bgTo: "280 40% 55%",
    topbar: "265 25% 9% / 0.85",
    panel: { h: 265, s: 25, l: 10 },
    swatch: "linear-gradient(135deg,#e08858,#9667b3)",
  }),
  make({
    id: "ocean-depth", name: "Ocean Depth",
    bgFrom: "200 70% 50%", bgTo: "188 55% 75%",
    topbar: "210 35% 8% / 0.85",
    panel: { h: 210, s: 35, l: 9 },
    swatch: "linear-gradient(135deg,#2c8cc4,#9bd6dd)",
  }),
  make({
    id: "lavender-sky", name: "Lavender Sky",
    bgFrom: "270 55% 70%", bgTo: "330 70% 82%",
    topbar: "265 25% 10% / 0.85",
    panel: { h: 265, s: 25, l: 10 },
    swatch: "linear-gradient(135deg,#b58cdb,#f4a8c8)",
  }),
  make({
    id: "volcanic", name: "Volcanic",
    bgFrom: "0 70% 45%", bgTo: "30 90% 60%",
    topbar: "0 30% 8% / 0.88",
    panel: { h: 0, s: 25, l: 8 },
    swatch: "linear-gradient(135deg,#c4332a,#f29a3a)",
  }),
  make({
    id: "mint-frost", name: "Mint Frost",
    bgFrom: "160 55% 70%", bgTo: "200 60% 88%",
    topbar: "200 30% 10% / 0.85",
    panel: { h: 200, s: 25, l: 10 },
    swatch: "linear-gradient(135deg,#7fdcb8,#bfe4f2)",
  }),
  make({
    id: "royal-plum", name: "Royal Plum",
    bgFrom: "42 80% 60%", bgTo: "285 45% 35%",
    topbar: "285 30% 8% / 0.88",
    panel: { h: 285, s: 30, l: 9 },
    swatch: "linear-gradient(135deg,#e9b13a,#7a3f8c)",
  }),
];

export const DEFAULT_THEME_ID = "sunset-crag";
