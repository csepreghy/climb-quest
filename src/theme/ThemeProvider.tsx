import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  BOX_THEMES, BG_THEMES, HEADER_THEMES, STAGE_THEMES, DEFAULTS, type ThemeOption,
} from "./themes";

export type ThemeAxis = "box" | "bg" | "header" | "stage";

const REGISTRY: Record<ThemeAxis, ThemeOption[]> = {
  box: BOX_THEMES,
  bg: BG_THEMES,
  header: HEADER_THEMES,
  stage: STAGE_THEMES,
};

const STORAGE_KEY = "cq.theme.v2";

type State = Record<ThemeAxis, string>;

type Ctx = {
  selections: State;
  set: (axis: ThemeAxis, id: string) => void;
  options: typeof REGISTRY;
  current: Record<ThemeAxis, ThemeOption>;
};

const ThemeCtx = createContext<Ctx | null>(null);

function load(): State {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULTS };
}

function apply(opt: ThemeOption) {
  const root = document.documentElement;
  for (const [k, v] of Object.entries(opt.vars)) root.style.setProperty(k, v);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [selections, setSelections] = useState<State>(load);

  const current = useMemo(() => ({
    box:    REGISTRY.box.find(t => t.id === selections.box) ?? REGISTRY.box[0],
    bg:     REGISTRY.bg.find(t => t.id === selections.bg) ?? REGISTRY.bg[0],
    header: REGISTRY.header.find(t => t.id === selections.header) ?? REGISTRY.header[0],
    stage:  REGISTRY.stage.find(t => t.id === selections.stage) ?? REGISTRY.stage[0],
  }), [selections]);

  useEffect(() => {
    apply(current.box);
    apply(current.bg);
    apply(current.header);
    apply(current.stage);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selections));
  }, [current, selections]);

  const set = useCallback((axis: ThemeAxis, id: string) =>
    setSelections(s => ({ ...s, [axis]: id })), []);

  return (
    <ThemeCtx.Provider value={{ selections, set, options: REGISTRY, current }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
