import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { computeChalk, scaledActivityReward, awardChalk } from "@/game/store";
import type { BoardSessionRow, BoardType, MoonboardVariantId } from "./types";
import { DEFAULT_KILTER_ANGLES } from "./types";
import { gradeRank, type BoardGradeSystem } from "./grades";

// ---------- Local preferences ----------
const PREFS_KEY = "cq:boardPrefs:v1";
export interface BoardPrefs {
  last_board_type: BoardType;
  last_moonboard_variant: MoonboardVariantId;
  last_kilter_angle: number;
  last_grade_system: BoardGradeSystem;
  kilter_angles: number[];
}
const DEFAULT_PREFS: BoardPrefs = {
  last_board_type: "moonboard",
  last_moonboard_variant: "mb_2019",
  last_kilter_angle: 40,
  last_grade_system: "v",
  kilter_angles: DEFAULT_KILTER_ANGLES,
};

export function loadBoardPrefs(): BoardPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch { return DEFAULT_PREFS; }
}
export function saveBoardPrefs(p: Partial<BoardPrefs>) {
  const next = { ...loadBoardPrefs(), ...p };
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  return next;
}

// ---------- Reward formula ----------
/** Base chalk reward by how the climb's grade compares to the user's prior PR (rank). */
export function boardBaseReward(newRank: number, priorMaxRank: number | null): { base: number; isPR: boolean } {
  if (priorMaxRank == null || newRank > priorMaxRank) return { base: 200, isPR: true };
  const diff = priorMaxRank - newRank;
  if (diff <= 0) return { base: 200, isPR: false }; // tied PR
  if (diff <= 2) return { base: 100, isPR: false };
  if (diff <= 4) return { base: 50, isPR: false };
  return { base: 25, isPR: false };
}

/** Reuse the boulder chalk pipeline so equipped/streak/tier/crit/cap bonuses all apply. */
export function computeBoardChalk(boardBase: number, flashed: boolean) {
  const boulderBase = scaledActivityReward("boulder");
  const diffMult = boardBase / Math.max(1, boulderBase);
  return computeChalk("boulder", [], false, flashed, diffMult);
}

// ---------- Supabase API ----------
export async function fetchBoardSessions(userId: string): Promise<BoardSessionRow[]> {
  const { data, error } = await supabase
    .from("board_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as BoardSessionRow[];
}

export interface BoardLogInput {
  board_type: BoardType;
  moonboard_variant: MoonboardVariantId | null;
  kilter_angle: number | null;
  problem_name: string | null;
  is_benchmark: boolean;
  is_flash: boolean;
  grade_system: BoardGradeSystem;
  grade: string;
  logged_at: string; // YYYY-MM-DD
  notes?: string | null;
}

export async function logBoardSession(userId: string, input: BoardLogInput, prevMaxRank: number | null): Promise<{ row: BoardSessionRow; chalk: number; isPR: boolean }> {
  const rank = gradeRank(input.grade, input.grade_system);
  const { base, isPR } = boardBaseReward(rank, prevMaxRank);
  const breakdown = computeBoardChalk(base, input.is_flash);
  const chalk = breakdown.total;

  const { data, error } = await supabase
    .from("board_sessions")
    .insert({
      user_id: userId,
      logged_at: input.logged_at,
      board_type: input.board_type,
      moonboard_variant: input.moonboard_variant,
      kilter_angle: input.kilter_angle,
      problem_name: input.problem_name,
      is_benchmark: input.is_benchmark,
      is_flash: input.is_flash,
      grade_system: input.grade_system,
      grade: input.grade,
      grade_rank: rank,
      chalk_awarded: chalk,
      notes: input.notes ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;

  // Credit chalk to the player's running totals immediately.
  awardChalk(chalk);


  return { row: data as BoardSessionRow, chalk, isPR };
}

export interface BoardEditInput {
  board_type: BoardType;
  moonboard_variant: MoonboardVariantId | null;
  kilter_angle: number | null;
  problem_name: string | null;
  is_benchmark: boolean;
  is_flash: boolean;
  grade_system: BoardGradeSystem;
  grade: string;
  logged_at: string;
  notes?: string | null;
}

export async function updateBoardSession(id: string, input: BoardEditInput): Promise<BoardSessionRow> {
  const rank = gradeRank(input.grade, input.grade_system);
  const { data, error } = await supabase
    .from("board_sessions")
    .update({
      logged_at: input.logged_at,
      board_type: input.board_type,
      moonboard_variant: input.moonboard_variant,
      kilter_angle: input.kilter_angle,
      problem_name: input.problem_name,
      is_benchmark: input.is_benchmark,
      is_flash: input.is_flash,
      grade_system: input.grade_system,
      grade: input.grade,
      grade_rank: rank,
      notes: input.notes ?? null,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as BoardSessionRow;
}

export async function deleteBoardSession(id: string): Promise<void> {
  const { error } = await supabase.from("board_sessions").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Hook ----------
export function useBoardSessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<BoardSessionRow[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) { setSessions([]); return; }
    setLoading(true);
    try { setSessions(await fetchBoardSessions(user.id)); }
    catch (e) { console.error("board sessions fetch failed", e); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { void refresh(); }, [refresh]);

  return { sessions, loading, refresh };
}

/** User's all-time top grade-rank across logged board sessions. */
export function maxBoardRank(sessions: BoardSessionRow[]): number | null {
  if (!sessions.length) return null;
  return sessions.reduce((m, s) => Math.max(m, s.grade_rank), 0);
}
