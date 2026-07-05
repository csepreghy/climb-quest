// Rolling 7-day Strength Tier system.
// Daily qualifier: ≥10 combined reps OR ≥30s combined holds (or a proportional split).
// Tier from qualifying days in the last 7 calendar days:
//   3-4 → bronze (+5% chalk)
//   5-6 → silver (+10% chalk)
//   7   → gold   (+15% chalk, +5% crit)
// No streak reset cliff — tier recalculates daily.

import type { StrengthSession } from "./store";

export type StrengthTier = "none" | "bronze" | "silver" | "gold";

export const STRENGTH_TIER = {
  qualifierReps: 10,
  qualifierSeconds: 30,
  bronzeDays: 3,
  silverDays: 5,
  goldDays: 7,
  bronzeChalkPct: 5,
  silverChalkPct: 10,
  goldChalkPct: 15,
  goldCritPct: 5,
} as const;

function dayKey(iso: string | Date): string {
  return new Date(iso).toDateString();
}

/** Sum reps + hold seconds for sessions on a given day. */
function dayTotals(sessions: StrengthSession[], targetKey: string): { reps: number; seconds: number } {
  let reps = 0, seconds = 0;
  for (const ss of sessions) {
    if (dayKey(ss.date) !== targetKey) continue;
    // Hangboard sessions always count as hold seconds regardless of set shape.
    const isHang = (ss as any).workout === "hangboard" || (ss as any).hangboard;
    if (isHang) {
      const meta = (ss as any).hangboard;
      const metaSecs = meta && Array.isArray(meta.holds)
        ? meta.holds.reduce((a: number, h: any) => a + (Number(h.seconds) || 0), 0)
        : 0;
      const setSecs = (ss.sets ?? []).reduce((a, st) => a + (Number(st.reps) || 0), 0);
      seconds += Math.max(metaSecs, setSecs, Number((ss as any).totalReps) || 0);
      continue;
    }
    for (const st of ss.sets ?? []) {
      const v = Number(st.reps) || 0;
      if (st.mode === "hold") seconds += v;
      else reps += v;
    }
  }
  return { reps, seconds };
}

export function qualifiesForDay(sessions: StrengthSession[], dayISO: string | Date): boolean {
  const { reps, seconds } = dayTotals(sessions, dayKey(dayISO));
  if (reps >= STRENGTH_TIER.qualifierReps) return true;
  if (seconds >= STRENGTH_TIER.qualifierSeconds) return true;
  return reps / STRENGTH_TIER.qualifierReps + seconds / STRENGTH_TIER.qualifierSeconds >= 1;
}

/** Returns the 7-day window ending today (oldest first → today last) with qualified flags. */
export function rolling7(sessions: StrengthSession[], today: Date = new Date()): {
  qualifiedDays: number;
  mask: boolean[];          // length 7, index 0 = 6 days ago, index 6 = today
} {
  const mask: boolean[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000);
    mask.push(qualifiesForDay(sessions, d));
  }
  const qualifiedDays = mask.filter(Boolean).length;
  return { qualifiedDays, mask };
}

export function tierFromQualifiedDays(n: number): StrengthTier {
  if (n >= STRENGTH_TIER.goldDays) return "gold";
  if (n >= STRENGTH_TIER.silverDays) return "silver";
  if (n >= STRENGTH_TIER.bronzeDays) return "bronze";
  return "none";
}

export function tierFor(sessions: StrengthSession[], today: Date = new Date()): {
  tier: StrengthTier;
  qualifiedDays: number;
  mask: boolean[];
} {
  const r = rolling7(sessions, today);
  return { tier: tierFromQualifiedDays(r.qualifiedDays), ...r };
}

export function tierChalkPct(tier: StrengthTier): number {
  switch (tier) {
    case "bronze": return STRENGTH_TIER.bronzeChalkPct;
    case "silver": return STRENGTH_TIER.silverChalkPct;
    case "gold":   return STRENGTH_TIER.goldChalkPct;
    default: return 0;
  }
}

export function tierCritPct(tier: StrengthTier): number {
  return tier === "gold" ? STRENGTH_TIER.goldCritPct : 0;
}

export const TIER_LABEL: Record<StrengthTier, string> = {
  none: "—",
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
};

/** Tailwind-compatible color classes per tier (text). */
export const TIER_TEXT: Record<StrengthTier, string> = {
  none: "text-muted-foreground",
  bronze: "text-[hsl(28_70%_55%)]",
  silver: "text-[hsl(0_0%_82%)]",
  gold: "text-legendary",
};

/** Background color for fill dots. */
export const TIER_FILL: Record<StrengthTier, string> = {
  none: "bg-muted-foreground/40",
  bronze: "bg-[hsl(28_70%_55%)]",
  silver: "bg-[hsl(0_0%_82%)]",
  gold: "bg-legendary",
};

/** Threshold display string for tooltips/modals. */
export function tierThresholdsLabel(): string {
  return `Bronze ${STRENGTH_TIER.bronzeDays} · Silver ${STRENGTH_TIER.silverDays} · Gold ${STRENGTH_TIER.goldDays}`;
}
