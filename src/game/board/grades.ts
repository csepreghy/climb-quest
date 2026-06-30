// Grade systems for board climbing (MoonBoard / Kilter).
// Ranks are aligned to the V-scale so French → V comparisons are direct.

export type BoardGradeSystem = "v" | "french";

export const V_GRADES = [
  "V0","V1","V2","V3","V4","V5","V6","V7","V8","V9","V10","V11","V12","V13","V14","V15","V16","V17",
];

// French boulder scale mapped to V-rank.
// Standard conversion (4 → V0, 5 → V1, 5+ → V2, 6A → V3, …, 9A → V17).
const FRENCH_TO_V: { label: string; rank: number }[] = [
  { label: "4",    rank: 0 },
  { label: "5",    rank: 1 },
  { label: "5+",   rank: 2 },
  { label: "6A",   rank: 3 },
  { label: "6A+",  rank: 4 },
  { label: "6B",   rank: 4 },
  { label: "6B+",  rank: 5 },
  { label: "6C",   rank: 5 },
  { label: "6C+",  rank: 6 },
  { label: "7A",   rank: 6 },
  { label: "7A+",  rank: 7 },
  { label: "7B",   rank: 8 },
  { label: "7B+",  rank: 8 },
  { label: "7C",   rank: 9 },
  { label: "7C+",  rank: 10 },
  { label: "8A",   rank: 11 },
  { label: "8A+",  rank: 12 },
  { label: "8B",   rank: 13 },
  { label: "8B+",  rank: 14 },
  { label: "8C",   rank: 15 },
  { label: "8C+",  rank: 16 },
  { label: "9A",   rank: 17 },
];

export const FRENCH_GRADES = FRENCH_TO_V.map(g => g.label);

export function gradesForSystem(sys: BoardGradeSystem): string[] {
  return sys === "v" ? V_GRADES : FRENCH_GRADES;
}

export function gradeRank(grade: string, sys: BoardGradeSystem): number {
  if (sys === "v") {
    const i = V_GRADES.indexOf(grade.toUpperCase());
    return i >= 0 ? i : 0;
  }
  const f = FRENCH_TO_V.find(g => g.label.toLowerCase() === grade.toLowerCase());
  return f ? f.rank : 0;
}

export function rankToVLabel(rank: number): string {
  const i = Math.max(0, Math.min(V_GRADES.length - 1, Math.round(rank)));
  return V_GRADES[i];
}
