import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BEASTMAKER_1000_HOLDS, type HangboardHold, type HoldPosition } from "./beastmaker1000";

const CALIBRATION_ID = "default";

/** Stored shape: { [holdId]: HoldPosition[] }. We only persist positions; type/label/etc. stay in code. */
export type CalibrationDoc = Record<string, HoldPosition[]>;

export function mergeHolds(base: HangboardHold[], overrides: CalibrationDoc | null | undefined): HangboardHold[] {
  if (!overrides) return base;
  return base.map(h => {
    const o = overrides[h.id];
    if (!o || !Array.isArray(o) || o.length === 0) return h;
    // Ensure we keep exactly the same number of positions the base expects.
    const positions = h.positions.map((p, i) => o[i] ? { ...p, ...o[i] } : p);
    return { ...h, positions };
  });
}

export function holdsToCalibrationDoc(holds: HangboardHold[]): CalibrationDoc {
  const doc: CalibrationDoc = {};
  for (const h of holds) doc[h.id] = h.positions.map(({ x, y, w, h: hh }) => ({ x, y, w, h: hh }));
  return doc;
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
      return (data?.holds as CalibrationDoc) ?? null;
    },
  });
}

export function useEffectiveHolds(): HangboardHold[] {
  const { data } = useHangboardCalibration();
  return mergeHolds(BEASTMAKER_1000_HOLDS, data);
}

export function useSaveCalibration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (doc: CalibrationDoc) => {
      const userId = (await supabase.auth.getUser()).data.user?.id ?? null;
      const { error } = await supabase
        .from("hangboard_calibration")
        .upsert({ id: CALIBRATION_ID, holds: doc, updated_at: new Date().toISOString(), updated_by: userId });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.setQueryData(["hangboard-calibration"], vars);
    },
  });
}
