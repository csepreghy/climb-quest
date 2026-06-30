export type ThreeDStyle = "flat" | "inset" | "raised" | "lithograph" | "relief" | "button-bevel";
export type EdgeStyle = "none" | "gold-top" | "gold-all" | "chiseled";
export type BottomStyle = "none" | "solid" | "fade";
export type BottomColorType = "gold" | "dark" | "custom";
export type TexTint = "dark" | "gold";
export type BevelLipColorType = "auto-dark" | "gold" | "custom";

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
  // Bottom Border Customizations (::after strip)
  bottomHeight: number;   // 1..12 px
  bottomColorType: BottomColorType;
  bottomHue: number;
  bottomSat: number;
  bottomLight: number;
  bottomOpacity: number;
  // Inner bevel lip — the button-style inset 3D bottom line
  bevelLipEnabled: boolean;
  bevelLipHeight: number;       // 1..8 px
  bevelLipColorType: BevelLipColorType;
  bevelLipHue: number;
  bevelLipSat: number;
  bevelLipLight: number;
  bevelLipOpacity: number;      // 0..1
  // Outer frame ring (like button's 2px frame)
  frameRingEnabled: boolean;
  frameRingWidth: number;       // 1..4
  // Drop shadow (lift off background)
  dropShadowEnabled: boolean;
  dropShadowStrength: number;   // 0..1
  // Link lip color to bottom border color (edit together)
  linkLipToBottom: boolean;
}

export const DEFAULT_CONFIG: CardLabConfig = {
  hue: 220,
  sat: 24,
  light: 12,
  texOpacity: 0.45,
  texFreq: 0.85,
  texTint: "dark",
  threeD: "inset",
  edge: "gold-top",
  bottom: "none",
  radius: 12,
  bottomHeight: 3,
  bottomColorType: "gold",
  bottomHue: 45,
  bottomSat: 85,
  bottomLight: 50,
  bottomOpacity: 1.0,
  bevelLipEnabled: false,
  bevelLipHeight: 3,
  bevelLipColorType: "auto-dark",
  bevelLipHue: 220,
  bevelLipSat: 60,
  bevelLipLight: 2,
  bevelLipOpacity: 0.9,
  frameRingEnabled: false,
  frameRingWidth: 2,
  dropShadowEnabled: true,
  dropShadowStrength: 0.72,
  linkLipToBottom: true,
};


export const PRESETS: Record<string, { label: string; config: CardLabConfig }> = {
  current: {
    label: "Current production",
    config: { ...DEFAULT_CONFIG },
  },
  bronze: {
    label: "Bronze plaque",
    config: {
      ...DEFAULT_CONFIG,
      hue: 220,
      sat: 22,
      light: 6,
      texOpacity: 0.18,
      texFreq: 0.9,
      texTint: "gold",
      threeD: "raised",
      edge: "gold-all",
      bottom: "solid",
      bottomColorType: "gold",
      bottomHeight: 3,
      radius: 10,
    },
  },
  carved: {
    label: "Carved stone",
    config: {
      ...DEFAULT_CONFIG,
      hue: 220,
      sat: 18,
      light: 4,
      texOpacity: 0.55,
      texFreq: 0.7,
      texTint: "dark",
      threeD: "inset",
      edge: "chiseled",
      bottom: "solid",
      bottomColorType: "dark",
      bottomHeight: 4,
      radius: 8,
    },
  },
  lithograph: {
    label: "Lithograph",
    config: {
      ...DEFAULT_CONFIG,
      hue: 220,
      sat: 28,
      light: 5,
      texOpacity: 0.08,
      texFreq: 1.0,
      texTint: "dark",
      threeD: "lithograph",
      edge: "gold-top",
      bottom: "fade",
      bottomColorType: "gold",
      bottomHeight: 3,
      radius: 14,
    },
  },
  relief: {
    label: "Carved relief",
    config: {
      ...DEFAULT_CONFIG,
      hue: 220,
      sat: 24,
      light: 6,
      texOpacity: 0.35,
      texFreq: 0.8,
      texTint: "dark",
      threeD: "relief",
      edge: "gold-top",
      bottom: "fade",
      bottomColorType: "gold",
      bottomHeight: 3,
      radius: 12,
    },
  },
  buttonBevel: {
    label: "Button bevel (dark)",
    config: {
      ...DEFAULT_CONFIG,
      hue: 220,
      sat: 22,
      light: 7,
      texOpacity: 0.22,
      texFreq: 0.85,
      texTint: "dark",
      threeD: "button-bevel",
      edge: "none",
      bottom: "none",
      bevelLipEnabled: true,
      bevelLipHeight: 4,
      bevelLipColorType: "auto-dark",
      bevelLipOpacity: 0.95,
      frameRingEnabled: true,
      frameRingWidth: 2,
      dropShadowEnabled: true,
      dropShadowStrength: 0.55,
      radius: 14,
    },
  },
};


function shadowFor(style: ThreeDStyle): string {
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
    case "button-bevel":
      // Mirrors GameButton: top inner highlight only. Bottom lip + frame + drop
      // shadow are layered via their own controls so each is independently tunable.
      return "inset 0 2px 0 hsl(0 0% 100% / 0.18)";
  }
}

function bevelLipShadow(c: CardLabConfig): string | null {
  if (!c.bevelLipEnabled) return null;
  const h = Math.max(1, c.bevelLipHeight | 0);
  const op = c.bevelLipOpacity.toFixed(2);

  // When linked, derive lip color from the bottom-border color so they stay
  // in sync visually. Lip uses its own opacity slider.
  let colorType: BevelLipColorType = c.bevelLipColorType;
  let hue = c.bevelLipHue, sat = c.bevelLipSat, light = c.bevelLipLight;
  if (c.linkLipToBottom && c.bottom !== "none") {
    if (c.bottomColorType === "gold") colorType = "gold";
    else if (c.bottomColorType === "dark") colorType = "auto-dark";
    else {
      colorType = "custom";
      hue = c.bottomHue; sat = c.bottomSat; light = c.bottomLight;
    }
  }

  let color: string;
  if (colorType === "auto-dark") {
    color = `hsl(${c.hue} ${Math.max(40, c.sat)}% ${Math.max(1, c.light - 4)}% / ${op})`;
  } else if (colorType === "gold") {
    color = `hsl(45 85% 45% / ${op})`;
  } else {
    color = `hsl(${hue} ${sat}% ${light}% / ${op})`;
  }
  return `inset 0 -${h}px 0 ${color}`;
}

function frameRingShadow(c: CardLabConfig): string | null {
  if (!c.frameRingEnabled) return null;
  const w = Math.max(1, c.frameRingWidth | 0);
  return `0 0 0 ${w}px hsl(var(--panel-frame))`;
}

function dropShadow(c: CardLabConfig): string | null {
  if (!c.dropShadowEnabled) return null;
  const s = c.dropShadowStrength.toFixed(2);
  return `0 8px 16px -8px hsl(0 0% 0% / ${s})`;
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

function bottomRule(c: CardLabConfig): { after?: string } {
  const style = c.bottom;
  if (style === "none") return {};

  let colorStr = "";
  let glowStr = "";

  const opacityStr = c.bottomOpacity !== undefined ? c.bottomOpacity.toFixed(2) : "1.0";

  if (c.bottomColorType === "gold") {
    colorStr = `hsl(45 85% 50% / ${opacityStr})`;
    glowStr = `box-shadow: 0 0 8px hsl(45 85% 55% / ${(Number(opacityStr) * 0.4).toFixed(2)});`;
  } else if (c.bottomColorType === "dark") {
    colorStr = `hsl(220 60% 1% / ${opacityStr})`;
  } else {
    // Custom color
    const hue = c.bottomHue ?? 45;
    const sat = c.bottomSat ?? 85;
    const light = c.bottomLight ?? 50;
    colorStr = `hsl(${hue} ${sat}% ${light}% / ${opacityStr})`;
    glowStr = `box-shadow: 0 0 8px hsl(${hue} ${sat}% ${light}% / ${(Number(opacityStr) * 0.4).toFixed(2)});`;
  }

  const height = c.bottomHeight ?? 3;

  if (style === "solid") {
    return {
      after: `content:""; position:absolute; left:0; right:0; bottom:0; height:${height}px; pointer-events:none; background:${colorStr}; border-bottom-left-radius:inherit; border-bottom-right-radius:inherit; ${glowStr}`,
    };
  } else if (style === "fade") {
    return {
      after: `content:""; position:absolute; left:0; right:0; bottom:0; height:${height}px; pointer-events:none; background:linear-gradient(90deg, transparent 0%, ${colorStr} 50%, transparent 100%); border-bottom-left-radius:inherit; border-bottom-right-radius:inherit;`,
    };
  }

  return {};
}

function textureBg(c: CardLabConfig): string {
  if (c.texOpacity <= 0.001) return "none";
  const hi = c.texTint === "gold" ? "hsl(45, 85%, 62%)" : "hsl(30, 12%, 78%)";
  const lo = "hsl(220, 60%, 2%)";
  const a = c.texOpacity.toFixed(2);
  const aHi = (c.texOpacity * 0.85).toFixed(2);
  const f = c.texFreq.toFixed(2);
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260'>` +
    `<filter id='s'>` +
    `<feTurbulence type='fractalNoise' baseFrequency='${f}' numOctaves='2' seed='3' stitchTiles='stitch'/>` +
    `<feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${a} -0.35'/>` +
    `</filter>` +
    `<filter id='h'>` +
    `<feTurbulence type='fractalNoise' baseFrequency='${f}' numOctaves='2' seed='11' stitchTiles='stitch'/>` +
    `<feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${aHi} -0.45'/>` +
    `</filter>` +
    `<rect width='100%' height='100%' filter='url(#s)' fill='${lo}'/>` +
    `<rect width='100%' height='100%' filter='url(#h)' fill='${hi}'/>` +
    `</svg>`;
  const encoded = encodeURIComponent(svg)
    .replace(/'/g, "%27")
    .replace(/"/g, "%22");
  return `url("data:image/svg+xml;utf8,${encoded}")`;
}

export function buildCss(selector: string, c: CardLabConfig): string {
  const fill = `hsl(${c.hue} ${c.sat}% ${c.light}%)`;
  const shadow = [
    shadowFor(c.threeD),
    edgeRule(c.edge).extraShadow,
    bevelLipShadow(c),
    frameRingShadow(c),
    dropShadow(c),
  ].filter(Boolean).join(", ");
  const tex = textureBg(c);
  const beforeCss = edgeRule(c.edge).before;
  const afterCss = bottomRule(c).after;

  return `
${selector} {
  background-color: ${fill} !important;
  background-image: ${tex} !important;
  background-repeat: repeat;
  background-blend-mode: normal;
  box-shadow: ${shadow} !important;
  border-radius: ${c.radius}px !important;
  position: relative;
  overflow: hidden;
}
${beforeCss ? `${selector}::before { ${beforeCss} z-index: 3; }` : ""}
${afterCss ? `${selector}::after { ${afterCss} z-index: 3; }` : ""}
`.trim();
}


export const LS_KEY = "cq.cardLab.v2";
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
  // Also expose the card fill as the header (topbar) color so the sticky
  // header matches the card background exactly.
  const rootVars = `:root { --topbar-color: ${config.hue} ${config.sat}% ${config.light}%; --topbar-opacity: 1; }`;
  tag.textContent = `${rootVars}\n${buildCss(".rpg-panel", config)}`;
}

export function loadSavedState(): { config: CardLabConfig; global: boolean } {
  if (typeof window === "undefined") return { config: DEFAULT_CONFIG, global: false };
  try {
    const raw = localStorage.getItem(LS_KEY) || localStorage.getItem("cq.cardLab.v1");
    if (!raw) return { config: DEFAULT_CONFIG, global: false };
    const parsed = JSON.parse(raw);
    const loadedConfig = { ...DEFAULT_CONFIG, ...(parsed.config || {}) };
    
    // Handle migration of legacy bottom styles
    if (loadedConfig.bottom === "dark-thick") {
      loadedConfig.bottom = "solid";
      loadedConfig.bottomColorType = "dark";
      loadedConfig.bottomHeight = 4;
    } else if (loadedConfig.bottom === "gold-solid") {
      loadedConfig.bottom = "solid";
      loadedConfig.bottomColorType = "gold";
      loadedConfig.bottomHeight = 3;
    } else if (loadedConfig.bottom === "gold-fade") {
      loadedConfig.bottom = "fade";
      loadedConfig.bottomColorType = "gold";
      loadedConfig.bottomHeight = 3;
    }
    
    return {
      config: loadedConfig,
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

// ---------------------------------------------------------------------------
// Remote (app-wide) card style — stored in `card_lab_settings` so an admin's
// changes apply for every visitor. We also cache the last fetched config in
// localStorage and apply it synchronously on boot to avoid a flash of the
// default look before the network fetch resolves.
// ---------------------------------------------------------------------------

export const REMOTE_CACHE_KEY = "cq.cardLab.remote.v1";

export function applyCachedRemoteCss(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(REMOTE_CACHE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.config) return false;
    const cfg = { ...DEFAULT_CONFIG, ...parsed.config } as CardLabConfig;
    applyGlobalCss(cfg);
    return true;
  } catch {
    return false;
  }
}

export async function fetchAndApplyRemoteCss(): Promise<void> {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase
      .from("card_lab_settings")
      .select("config")
      .eq("id", 1)
      .maybeSingle();
    if (error || !data?.config) return;
    const cfg = { ...DEFAULT_CONFIG, ...(data.config as Partial<CardLabConfig>) } as CardLabConfig;
    applyGlobalCss(cfg);
    try {
      localStorage.setItem(REMOTE_CACHE_KEY, JSON.stringify({ config: cfg }));
    } catch {}
  } catch {
    /* ignore */
  }
}

export async function saveRemoteConfig(config: CardLabConfig): Promise<void> {
  const { supabase } = await import("@/integrations/supabase/client");
  const { data: userData } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("card_lab_settings")
    .upsert({ id: 1, config: JSON.parse(JSON.stringify(config)), updated_by: userData.user?.id ?? null, updated_at: new Date().toISOString() }, { onConflict: "id" });
  if (error) throw error;
  try {
    localStorage.setItem(REMOTE_CACHE_KEY, JSON.stringify({ config }));
  } catch {}
  applyGlobalCss(config);
}

