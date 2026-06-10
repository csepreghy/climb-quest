// Shared types for hangboard workouts.

export type HangStep =
  | { kind: "hang"; holdId: string; seconds: number }
  | { kind: "rest"; seconds: number };

export interface HangboardWorkout {
  id: string;
  userId: string | null;
  name: string;
  description: string | null;
  board: string;
  steps: HangStep[];
  isTemplate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HangboardRow {
  id: string;
  user_id: string | null;
  name: string;
  description: string | null;
  board: string;
  steps: unknown;
  is_template: boolean;
  created_at: string;
  updated_at: string;
}

export function rowToWorkout(r: HangboardRow): HangboardWorkout {
  return {
    id: r.id,
    userId: r.user_id,
    name: r.name,
    description: r.description,
    board: r.board,
    steps: Array.isArray(r.steps) ? (r.steps as HangStep[]) : [],
    isTemplate: r.is_template,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}
