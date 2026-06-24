export type ThreeDStyle = "flat" | "inset" | "raised" | "lithograph" | "relief";
export type EdgeStyle = "none" | "gold-top" | "gold-all" | "chiseled";
export type BottomStyle = "none" | "dark-thick" | "gold-solid" | "gold-fade";
export type TexTint = "dark" | "gold";

export interface CardLabConfig {
  hue: number;
  sat: number;
  light: number;
  texOpacity: number;     // 0..1
  texFreq: number;        // 0.4..1.4
  texTint: TexTint;
  threeD: ThreeDStyle;
  edge: EdgeStyle;
  bottom: BottomStyle;
  radius: number;         // px
}

export const DEFAULT_CONFIG: CardLabConfig = {
  hue: 220,
  sat: 28,
  light: 5,
  texOpacity: 0.45,
  texFreq: 0.85,
  texTint: "dark",
  threeD: "inset",
  edge: "gold-top",
  bottom: "none",
  radius: 12,
};

export const PRESETS: Record<string, { label: string; config: CardLabConfig }> = {
  current: {
    label: "Current production",
    config: { ...DEFAULT_CONFIG },
  },
  bronze: {
    label: "Bronze plaque",
    config: { hue: 220, sat: 22, light: 6, texOpacity: 0.18, texFreq: 0.9, texTint: "gold", threeD: "raised", edge: "gold-all", bottom: "gold-solid", radius: 10 },
  },
  carved: {
    label: "Carved stone",
    config: { hue: 220, sat: 18, light: 4, texOpacity: 0.55, texFreq: 0.7, texTint: "dark", threeD: "inset", edge: "chiseled", bottom: "dark-thick", radius: 8 },
  },
  lithograph: {
    label: "Lithograph",
    config: { hue: 220, sat: 28, light: 5, texOpacity: 0.08, texFreq: 1.0, texTint: "dark", threeD: "lithograph", edge: "gold-top", bottom: "gold-fade", radius: 14 },
  },
  relief: {
    label: "Carved relief",
    config: { hue: 220, sat: 24, light: 6, texOpacity: 0.35, texFreq: 0.8, texTint: "dark", threeD: "relief", edge: "gold-top", bottom: "gold-fade", radius: 12 },
  },
};

function shadowFor(style: ThreeDStyle): string {
  // 3D recipes are pure depth/lift. Rim lines belong to the edge control,
  // so the user never sees two competing borders.
  switch (style) {
    case "flat":
      return "0 2px 8px -2px hsl(0 0% 0% / 0.5)";
    case "inset":
      return [
        "inset 0 2px 8px hsl(220 60% 1% / 0.75)",
        "inset 0 -1px 0 hsl(220 25% 90% / 0.04)",
      ].join(", ");
    case "raised":
      return [
        "inset 0 2px 0 hsl(220 25% 90% / 0.08)",
        "inset 0 -3px 0 hsl(220 60% 1% / 0.9)",
        "0 6px 0 -1px hsl(220 50% 2%)",
        "0 18px 32px -16px hsl(0 0% 0% / 0.85)",
      ].join(", ");
    case "lithograph":
      return [
        "0 30px 60px -15px hsl(0 0% 0% / 0.9)",
        "0 12px 24px -10px hsl(0 0% 0% / 0.6)",
      ].join(", ");
    case "relief":
      return [
        "inset 0 2px 4px hsl(220 60% 1% / 0.85)",
        "inset 0 -2px 0 hsl(220 20% 20% / 0.45)",
        "0 14px 28px -14px hsl(0 0% 0% / 0.7)",
      ].join(", ");
  }
}

function edgeRule(style: EdgeStyle): { before?: string; extraShadow?: string } {
  switch (style) {
    case "none":
      return {};
    case "gold-top":
      return {
        before: `content:""; position:absolute; left:0; right:0; top:0; height:1px; pointer-events:none; background:linear-gradient(90deg, transparent 0%, hsl(45 85% 55% / 0.55) 50%, transparent 100%);`,
      };
    case "gold-all":
      return { extraShadow: "inset 0 0 0 1px hsl(45 85% 55% / 0.45)" };
    case "chiseled":
      return { extraShadow: "inset 0 1px 0 hsl(0 0% 100% / 0.12), inset 0 -1px 0 hsl(0 0% 0% / 0.75)" };
  }
}

function bottomRule(style: BottomStyle): { after?: string } {
  switch (style) {
    case "none":
      return {};
    case "dark-thick":
      return {
        after: `content:""; position:absolute; left:0; right:0; bottom:0; height:4px; pointer-events:none; background:hsl(220 60% 1%); border-bottom-left-radius:inherit; border-bottom-right-radius:inherit;`,
      };
    case "gold-solid":
      return {
        after: `content:""; position:absolute; left:0; right:0; bottom:0; height:3px; pointer-events:none; background:hsl(45 85% 50%); border-bottom-left-radius:inherit; border-bottom-right-radius:inherit; box-shadow:0 0 8px hsl(45 85% 55% / 0.4);`,
      };
    case "gold-fade":
      return {
        after: `content:""; position:absolute; left:0; right:0; bottom:0; height:3px; pointer-events:none; background:linear-gradient(90deg, transparent 0%, hsl(45 85% 55% / 0.85) 50%, transparent 100%); border-bottom-left-radius:inherit; border-bottom-right-radius:inherit;`,
      };
  }
}

function textureBg(c: CardLabConfig): string {
  if (c.texOpacity <= 0.001) return "none";
  const tintColor =
    c.texTint === "gold"
      ? "hsl(45, 85%, 55%)"
      : "hsl(220, 50%, 2%)";
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'>` +
    `<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='${c.texFreq.toFixed(2)}' numOctaves='2' stitchTiles='stitch'/>` +
    `<feColorMatrix type='matrix' values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${c.texOpacity.toFixed(2)} 0'/>` +
    `</filter>` +
    `<rect width='100%' height='100%' filter='url(#n)' fill='${tintColor}'/>` +
    `</svg>`;
  const encoded = encodeURIComponent(svg)
    .replace(/'/g, "%27")
    .replace(/"/g, "%22");
  return `url("data:image/svg+xml;utf8,${encoded}")`;
}

/**
 * Build a CSS string that styles `selector` (e.g. ".cq-card-lab-preview .rpg-panel"
 * or ".rpg-panel") with the given config.
 */
export function buildCss(selector: string, c: CardLabConfig): string {
  const fill = `hsl(${c.hue} ${c.sat}% ${c.light}%)`;
  const shadow = [shadowFor(c.threeD), edgeRule(c.edge).extraShadow].filter(Boolean).join(", ");
  const tex = textureBg(c);
  const beforeCss = edgeRule(c.edge).before;
  const afterCss = bottomRule(c.bottom).after;

  return `
${selector} {
  background-color: ${fill} !important;
  background-image: ${tex} !important;
  background-blend-mode: overlay;
  box-shadow: ${shadow} !important;
  border-radius: ${c.radius}px !important;
  position: relative;
  overflow: hidden;
}
${beforeCss ? `${selector}::before { ${beforeCss} z-index: 3; }` : ""}
${afterCss ? `${selector}::after { ${afterCss} z-index: 3; }` : ""}
`.trim();
}

export const LS_KEY = "cq.cardLab.v1";
export const GLOBAL_STYLE_ID = "cq-card-lab-global-style";

export function applyGlobalCss(config: CardLabConfig | null) {
  if (typeof document === "undefined") return;
  let tag = document.getElementById(GLOBAL_STYLE_ID) as HTMLStyleElement | null;
  if (!config) {
    if (tag) tag.remove();
    return;
  }
  if (!tag) {
    tag = document.createElement("style");
    tag.id = GLOBAL_STYLE_ID;
    document.head.appendChild(tag);
  }
  tag.textContent = buildCss(".rpg-panel", config);
}

export function loadSavedState(): { config: CardLabConfig; global: boolean } {
  if (typeof window === "undefined") return { config: DEFAULT_CONFIG, global: false };
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { config: DEFAULT_CONFIG, global: false };
    const parsed = JSON.parse(raw);
    return {
      config: { ...DEFAULT_CONFIG, ...(parsed.config || {}) },
      global: !!parsed.global,
    };
  } catch {
    return { config: DEFAULT_CONFIG, global: false };
  }
}

export function saveState(config: CardLabConfig, global: boolean) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ config, global }));
  } catch {}
}
