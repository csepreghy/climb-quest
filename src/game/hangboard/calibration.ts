import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BEASTMAKER_1000_HOLDS, type HangboardHold, type HoldPosition } from "./beastmaker1000";

const CALIBRATION_ID = "default";

/**
 * Stored shape (v2):
 *   { overrides: { [holdId]: { positions?: HoldPosition[]; label?: string } }, added: HangboardHold[] }
 * Legacy shape (v1) — still readable:
 *   { [holdId]: HoldPosition[] }
 */
export type HoldOverride = { positions?: HoldPosition[]; label?: string };
export type CalibrationDocV2 = { overrides?: Record<string, HoldOverride>; added?: HangboardHold[] };
export type CalibrationDoc = CalibrationDocV2 | Record<string, HoldPosition[]>;

function isLegacy(doc: CalibrationDoc): doc is Record<string, HoldPosition[]> {
  const keys = Object.keys(doc);
  if (keys.length === 0) return false;
  if ("overrides" in doc || "added" in doc) return false;
  const v = (doc as Record<string, unknown>)[keys[0]];
  return Array.isArray(v);
}

function normalize(doc: CalibrationDoc | null | undefined): CalibrationDocV2 {
  if (!doc) return { overrides: {}, added: [] };
  if (isLegacy(doc)) {
    const overrides: Record<string, HoldOverride> = {};
    for (const [id, positions] of Object.entries(doc)) overrides[id] = { positions };
    return { overrides, added: [] };
  }
  return { overrides: doc.overrides ?? {}, added: doc.added ?? [] };
}

export function mergeHolds(base: HangboardHold[], doc: CalibrationDoc | null | undefined): HangboardHold[] {
  const n = normalize(doc);
  const merged = base.map(h => {
    const o = n.overrides?.[h.id];
    if (!o) return h;
    let positions = h.positions;
    if (o.positions && o.positions.length > 0) {
      positions = h.positions.map((p, i) => (o.positions![i] ? { ...p, ...o.positions![i] } : p));
    }
    return { ...h, positions, label: o.label ?? h.label };
  });
  const added = (n.added ?? []).map(h => ({ ...h }));
  return [...merged, ...added];
}

export function holdsToCalibrationDoc(allHolds: HangboardHold[], base: HangboardHold[] = BEASTMAKER_1000_HOLDS): CalibrationDocV2 {
  const baseById = new Map(base.map(b => [b.id, b]));
  const overrides: Record<string, HoldOverride> = {};
  const added: HangboardHold[] = [];
  for (const h of allHolds) {
    const b = baseById.get(h.id);
    if (b) {
      const o: HoldOverride = { positions: h.positions.map(({ x, y, w, h: hh }) => ({ x, y, w, h: hh })) };
      if (h.label !== b.label) o.label = h.label;
      overrides[h.id] = o;
    } else {
      added.push(h);
    }
  }
  return { overrides, added };
}

export function useHangboardCalibration() {
  return useQuery({
    queryKey: ["hangboard-calibration"],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<CalibrationDoc | null> => {
      const { data, error } = await supabase
        .from("hangboard_calibration")
        .select("holds")
        .eq("id", CALIBRATION_ID)
        .maybeSingle();
      if (error) {
        console.warn("[hangboard] calibration fetch failed", error.message);
        return null;
      }
      return ((data?.holds as unknown) as CalibrationDoc) ?? null;
    },
  });
}

export function useEffectiveHolds(): HangboardHold[] {
  const { data } = useHangboardCalibration();
  return useMemo(() => mergeHolds(BEASTMAKER_1000_HOLDS, data), [data]);
}

export function useHoldLabel() {
  const holds = useEffectiveHolds();
  const byId = useMemo(() => {
    const m: Record<string, HangboardHold> = {};
    for (const h of holds) m[h.id] = h;
    return m;
  }, [holds]);
  return useCallback((id: string) => byId[id]?.label ?? id, [byId]);
}

export function useSaveCalibration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (doc: CalibrationDocV2) => {
      const userId = (await supabase.auth.getUser()).data.user?.id ?? null;
      const { error } = await supabase
        .from("hangboard_calibration")
        .upsert({ id: CALIBRATION_ID, holds: doc as never, updated_at: new Date().toISOString(), updated_by: userId });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.setQueryData(["hangboard-calibration"], vars);
    },
  });
}
