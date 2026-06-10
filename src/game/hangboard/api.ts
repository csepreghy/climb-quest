import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { rowToWorkout, type HangboardWorkout, type HangboardRow, type HangStep } from "./types";

/** Fetch templates + the current user's own workouts. */
export function useHangboardWorkouts() {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<HangboardWorkout[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("hangboard_workouts")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      setWorkouts((data as HangboardRow[]).map(rowToWorkout));
    }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh, user?.id]);

  return { workouts, loading, refresh };
}

export async function fetchWorkout(id: string): Promise<HangboardWorkout | null> {
  const { data, error } = await (supabase as any)
    .from("hangboard_workouts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return rowToWorkout(data as HangboardRow);
}

export async function saveWorkout(input: {
  id?: string;
  name: string;
  description?: string | null;
  steps: HangStep[];
  isTemplate?: boolean;
  userId: string;
}): Promise<{ id: string } | { error: string }> {
  const row = {
    name: input.name.trim(),
    description: input.description ?? null,
    board: "beastmaker_1000",
    steps: input.steps as unknown,
    is_template: !!input.isTemplate,
    user_id: input.isTemplate ? null : input.userId,
  };
  if (input.id) {
    const { error } = await (supabase as any)
      .from("hangboard_workouts")
      .update(row)
      .eq("id", input.id);
    if (error) return { error: error.message };
    return { id: input.id };
  } else {
    const { data, error } = await (supabase as any)
      .from("hangboard_workouts")
      .insert(row)
      .select("id")
      .single();
    if (error || !data) return { error: error?.message ?? "Failed to save" };
    return { id: (data as { id: string }).id };
  }
}

export async function deleteWorkout(id: string): Promise<boolean> {
  const { error } = await (supabase as any)
    .from("hangboard_workouts")
    .delete()
    .eq("id", id);
  return !error;
}
