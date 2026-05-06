import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_THEME_ID, PANEL_THEMES, type PanelTheme } from "./themes";

type Ctx = {
  theme: PanelTheme;
  setThemeId: (id: string) => void;
  themes: PanelTheme[];
};

const ThemeCtx = createContext<Ctx | null>(null);
const STORAGE_KEY = "cq.panelTheme";

function applyTheme(theme: PanelTheme) {
  const root = document.documentElement;
  for (const [k, v] of Object.entries(theme.vars)) {
    root.style.setProperty(k, v);
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeIdState] = useState<string>(() => {
    if (typeof window === "undefined") return DEFAULT_THEME_ID;
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME_ID;
  });

  const theme = useMemo(
    () => PANEL_THEMES.find(t => t.id === themeId) ?? PANEL_THEMES[0],
    [themeId],
  );

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme.id);
  }, [theme]);

  const setThemeId = useCallback((id: string) => setThemeIdState(id), []);

  return (
    <ThemeCtx.Provider value={{ theme, setThemeId, themes: PANEL_THEMES }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function usePanelTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("usePanelTheme must be used within ThemeProvider");
  return ctx;
}
