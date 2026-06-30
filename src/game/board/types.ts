import type { BoardGradeSystem } from "./grades";

export type BoardType = "moonboard" | "kilter";

export const MOONBOARD_VARIANTS = [
  { id: "mb_2016",      label: "MoonBoard 2016" },
  { id: "mb_2017",      label: "MoonBoard 2017" },
  { id: "mb_2019",      label: "MoonBoard 2019" },
  { id: "mini_mb_2020", label: "Mini MoonBoard 2020" },
  { id: "mb_2024",      label: "MoonBoard 2024" },
  { id: "mini_mb_2025", label: "Mini MoonBoard 2025" },
] as const;

export type MoonboardVariantId = typeof MOONBOARD_VARIANTS[number]["id"];

export const DEFAULT_KILTER_ANGLES = [25, 30, 35, 40, 45, 50, 55, 60, 65, 70];

export interface BoardSessionRow {
  id: string;
  user_id: string;
  logged_at: string; // YYYY-MM-DD
  board_type: BoardType;
  moonboard_variant: MoonboardVariantId | null;
  kilter_angle: number | null;
  problem_name: string | null;
  is_benchmark: boolean;
  is_flash: boolean;
  grade_system: BoardGradeSystem;
  grade: string;
  grade_rank: number;
  chalk_awarded: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function boardLabel(row: Pick<BoardSessionRow, "board_type" | "moonboard_variant" | "kilter_angle">): string {
  if (row.board_type === "moonboard") {
    const v = MOONBOARD_VARIANTS.find(m => m.id === row.moonboard_variant);
    return v?.label ?? "MoonBoard";
  }
  return row.kilter_angle != null ? `Kilter Board · ${row.kilter_angle}°` : "Kilter Board";
}
