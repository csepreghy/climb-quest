import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  BOX_THEMES, BG_THEMES, HEADER_THEMES, STAGE_THEMES, GLOW_THEMES, BACKDROP_THEMES,
  DEFAULTS, type ThemeOption,
} from "./themes";

export type ThemeAxis = "box" | "bg" | "header" | "stage" | "glow" | "backdrop";

const REGISTRY: Record<ThemeAxis, ThemeOption[]> = {
  box: BOX_THEMES,
  bg: BG_THEMES,
  header: HEADER_THEMES,
  stage: STAGE_THEMES,
  glow: GLOW_THEMES,
  backdrop: BACKDROP_THEMES,
};

const STORAGE_KEY = "cq.theme.v3";

type State = {
  selections: Record<ThemeAxis, string>;
  headerOpacity: number; // 0..1
};

const DEFAULT_STATE: State = {
  selections: { ...DEFAULTS },
  headerOpacity: 0.88,
};

type Ctx = {
  selections: Record<ThemeAxis, string>;
  headerOpacity: number;
  set: (axis: ThemeAxis, id: string) => void;
  setHeaderOpacity: (v: number) => void;
  options: typeof REGISTRY;
  current: Record<ThemeAxis, ThemeOption>;
};

const ThemeCtx = createContext<Ctx | null>(null);

function load(): State {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        selections: { ...DEFAULTS, ...(parsed.selections ?? {}) },
        headerOpacity: typeof parsed.headerOpacity === "number" ? parsed.headerOpacity : DEFAULT_STATE.headerOpacity,
      };
    }
  } catch {}
  return DEFAULT_STATE;
}

function applyVars(opt: ThemeOption) {
  const root = document.documentElement;
  for (const [k, v] of Object.entries(opt.vars)) root.style.setProperty(k, v);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(load);

  const current = useMemo(() => ({
    box:      REGISTRY.box.find(t => t.id === state.selections.box) ?? REGISTRY.box[0],
    bg:       REGISTRY.bg.find(t => t.id === state.selections.bg) ?? REGISTRY.bg[0],
    header:   REGISTRY.header.find(t => t.id === state.selections.header) ?? REGISTRY.header[0],
    stage:    REGISTRY.stage.find(t => t.id === state.selections.stage) ?? REGISTRY.stage[0],
    glow:     REGISTRY.glow.find(t => t.id === state.selections.glow) ?? REGISTRY.glow[0],
    backdrop: REGISTRY.backdrop.find(t => t.id === state.selections.backdrop) ?? REGISTRY.backdrop[0],
  }), [state.selections]);

  useEffect(() => {
    applyVars(current.box);
    applyVars(current.bg);
    applyVars(current.header);
    applyVars(current.stage);
    applyVars(current.glow);
    applyVars(current.backdrop);
    document.documentElement.style.setProperty("--topbar-opacity", String(state.headerOpacity));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [current, state]);

  const set = useCallback((axis: ThemeAxis, id: string) =>
    setState(s => ({ ...s, selections: { ...s.selections, [axis]: id } })), []);

  const setHeaderOpacity = useCallback((v: number) =>
    setState(s => ({ ...s, headerOpacity: v })), []);

  return (
    <ThemeCtx.Provider value={{
      selections: state.selections,
      headerOpacity: state.headerOpacity,
      set, setHeaderOpacity, options: REGISTRY, current,
    }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
