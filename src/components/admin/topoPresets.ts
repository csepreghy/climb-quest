// Topographic background config — admin-tunable + app-wide.
// Stored locally in localStorage and globally in supabase `topo_settings`.

export interface TopoConfig {
  enabled: boolean;          // turn the topographic layer on/off
  animated: boolean;         // animate contours over time
  speed: number;             // zOffset increment per frame (0.0001..0.01)
  levels: number;            // number of contour iso-lines (1..24)
  lineOpacity: number;       // 0..1
  lineWidth: number;         // 0.3..2 px
  contourHue: number;        // 0..360
  contourSat: number;        // 0..100
  contourLight: number;      // 0..100
  noiseScale: number;        // 0.0005..0.01 — bigger = busier
  textureOpacity: number;    // 0..1 mottle + grain strength
}

export const DEFAULT_TOPO: TopoConfig = {
  enabled: true,
  animated: false,
  speed: 0.0015,
  levels: 8,
  lineOpacity: 0.4,
  lineWidth: 0.7,
  contourHue: 45,
  contourSat: 88,
  contourLight: 58,
  noiseScale: 0.0035,
  textureOpacity: 1.0,
};

export const TOPO_LS_KEY = "cq.topo.v1";
export const TOPO_REMOTE_CACHE_KEY = "cq.topo.remote.v1";
export const TOPO_EVENT = "cq:topo-config";

let current: TopoConfig = DEFAULT_TOPO;

export function getTopoConfig(): TopoConfig {
  return current;
}

export function setTopoConfig(cfg: TopoConfig, persistLocal = true) {
  current = { ...DEFAULT_TOPO, ...cfg };
  if (persistLocal) {
    try { localStorage.setItem(TOPO_LS_KEY, JSON.stringify(current)); } catch {}
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(TOPO_EVENT, { detail: current }));
  }
}

export function loadTopoLocal(): TopoConfig {
  if (typeof window === "undefined") return DEFAULT_TOPO;
  try {
    const raw = localStorage.getItem(TOPO_LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      current = { ...DEFAULT_TOPO, ...parsed };
      return current;
    }
    const cached = localStorage.getItem(TOPO_REMOTE_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed?.config) {
        current = { ...DEFAULT_TOPO, ...parsed.config };
        return current;
      }
    }
  } catch {}
  return current;
}

export async function fetchAndApplyRemoteTopo(): Promise<void> {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await (supabase as any)
      .from("topo_settings")
      .select("config")
      .eq("id", 1)
      .maybeSingle();
    if (error || !data?.config) return;
    const cfg = { ...DEFAULT_TOPO, ...(data.config as Partial<TopoConfig>) } as TopoConfig;
    try {
      localStorage.setItem(TOPO_REMOTE_CACHE_KEY, JSON.stringify({ config: cfg }));
    } catch {}
    // Only override local if user has no local override saved.
    if (!localStorage.getItem(TOPO_LS_KEY)) {
      setTopoConfig(cfg, false);
    }
  } catch { /* ignore */ }
}

export async function saveRemoteTopo(config: TopoConfig): Promise<void> {
  const { supabase } = await import("@/integrations/supabase/client");
  const { data: userData } = await supabase.auth.getUser();
  const { error } = await (supabase as any)
    .from("topo_settings")
    .upsert(
      {
        id: 1,
        config: JSON.parse(JSON.stringify(config)),
        updated_by: userData.user?.id ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
  if (error) throw error;
  try {
    localStorage.setItem(TOPO_REMOTE_CACHE_KEY, JSON.stringify({ config }));
  } catch {}
}
