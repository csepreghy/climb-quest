import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  BOX_THEMES, BG_THEMES, HEADER_THEMES, STAGE_THEMES, GLOW_THEMES, ELEVATION_THEMES,
  DEFAULTS, type ThemeOption,
} from "./themes";
import { supabase } from "@/integrations/supabase/client";

export type ThemeAxis = "box" | "bg" | "header" | "stage" | "glow" | "elevation";

const REGISTRY: Record<ThemeAxis, ThemeOption[]> = {
  box: BOX_THEMES,
  bg: BG_THEMES,
  header: HEADER_THEMES,
  stage: STAGE_THEMES,
  glow: GLOW_THEMES,
  elevation: ELEVATION_THEMES,
};

// Local cache so the page boots with the last-known theme before the
// network round-trip resolves. The DB row is the source of truth.
const CACHE_KEY = "cq.theme.cache.v1";

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

function loadCache(): State {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
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
  const [state, setState] = useState<State>(loadCache);
  // Avoid echoing our own writes back into state via realtime.
  const writingRef = useRef(false);

  const current = useMemo(() => ({
    box:       REGISTRY.box.find(t => t.id === state.selections.box) ?? REGISTRY.box[0],
    bg:        REGISTRY.bg.find(t => t.id === state.selections.bg) ?? REGISTRY.bg[0],
    header:    REGISTRY.header.find(t => t.id === state.selections.header) ?? REGISTRY.header[0],
    stage:     REGISTRY.stage.find(t => t.id === state.selections.stage) ?? REGISTRY.stage[0],
    glow:      REGISTRY.glow.find(t => t.id === state.selections.glow) ?? REGISTRY.glow[0],
    elevation: REGISTRY.elevation.find(t => t.id === state.selections.elevation) ?? REGISTRY.elevation[0],
  }), [state.selections]);

  // Apply CSS vars + cache locally whenever state changes.
  useEffect(() => {
    applyVars(current.box);
    applyVars(current.bg);
    applyVars(current.header);
    applyVars(current.stage);
    applyVars(current.glow);
    applyVars(current.elevation);
    document.documentElement.style.setProperty("--topbar-opacity", String(state.headerOpacity));
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(state)); } catch {}
  }, [current, state]);

  // Initial fetch from DB + realtime subscription.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("app_theme_settings")
        .select("selections, header_opacity")
        .eq("id", "global")
        .maybeSingle();
      if (cancelled || !data) return;
      setState({
        selections: { ...DEFAULTS, ...((data.selections as Record<string, string>) ?? {}) },
        headerOpacity: typeof data.header_opacity === "number"
          ? data.header_opacity
          : Number(data.header_opacity ?? DEFAULT_STATE.headerOpacity),
      });
    })();

    const channel = supabase
      .channel("app_theme_settings")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_theme_settings", filter: "id=eq.global" },
        (payload) => {
          if (writingRef.current) return;
          const row: any = payload.new ?? payload.old;
          if (!row) return;
          setState({
            selections: { ...DEFAULTS, ...((row.selections as Record<string, string>) ?? {}) },
            headerOpacity: Number(row.header_opacity ?? DEFAULT_STATE.headerOpacity),
          });
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  // Persist any local change back to the DB. Non-admins will get an RLS
  // failure which we silently swallow (no-op locally).
  const persist = useCallback(async (next: State) => {
    writingRef.current = true;
    try {
      await supabase
        .from("app_theme_settings")
        .update({
          selections: next.selections,
          header_opacity: next.headerOpacity,
          updated_at: new Date().toISOString(),
        })
        .eq("id", "global");
    } finally {
      // Allow realtime echoes to flow again shortly after our write.
      setTimeout(() => { writingRef.current = false; }, 250);
    }
  }, []);

  const set = useCallback((axis: ThemeAxis, id: string) => {
    setState(s => {
      const next = { ...s, selections: { ...s.selections, [axis]: id } };
      void persist(next);
      return next;
    });
  }, [persist]);

  const setHeaderOpacity = useCallback((v: number) => {
    setState(s => {
      const next = { ...s, headerOpacity: v };
      void persist(next);
      return next;
    });
  }, [persist]);

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
