import { useState } from "react";
import { Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  STRENGTH_TIER, TIER_FILL, TIER_LABEL, TIER_TEXT, type StrengthTier,
  tierChalkPct, tierFor, tierThresholdsLabel,
} from "@/game/strengthTier";
import type { StrengthSession } from "@/game/store";

export function StrengthTierStrip({
  sessions, className,
}: { sessions: StrengthSession[]; className?: string }) {
  const [open, setOpen] = useState(false);
  const { tier, qualifiedDays, mask } = tierFor(sessions);
  const pct = tierChalkPct(tier);
  const todayQualified = mask[6];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn("w-full text-left", className)}
      >
        <div className="flex items-center justify-between gap-2 mb-1.5 text-xs">
          <div className="flex items-center gap-1.5">
            <Dumbbell className={cn("h-3.5 w-3.5", TIER_TEXT[tier])} />
            <span className="uppercase tracking-wider text-muted-foreground">Strength tier</span>
            <span className={cn("font-bold", TIER_TEXT[tier])}>{TIER_LABEL[tier]}</span>
            <span className="tabular-nums text-muted-foreground">· {qualifiedDays} of 7 days</span>
          </div>
          {pct > 0 && (
            <span className={cn("tabular-nums font-bold", TIER_TEXT[tier])}>+{pct}% chalk</span>
          )}
        </div>
        <div className="flex gap-1">
          {mask.map((q, i) => {
            const isToday = i === 6;
            return (
              <div
                key={i}
                className={cn(
                  "flex-1 h-1.5 rounded-full transition",
                  q
                    ? TIER_FILL[tier === "none" ? "bronze" : tier]
                    : isToday
                      ? "bg-secondary ring-1 ring-[hsl(var(--btn-orange))]/40 animate-pulse"
                      : "bg-secondary",
                )}
              />
            );
          })}
        </div>
        {!todayQualified && (
          <div className="mt-1 text-[10px] text-muted-foreground">
            Today: {STRENGTH_TIER.qualifierReps} reps or {STRENGTH_TIER.qualifierSeconds}s of holds to qualify
          </div>
        )}
      </button>

      <StrengthTierModal open={open} onOpenChange={setOpen} tier={tier} qualifiedDays={qualifiedDays} />
    </>
  );
}

export function StrengthTierModal({
  open, onOpenChange, tier, qualifiedDays,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tier: StrengthTier;
  qualifiedDays: number;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className={cn("h-5 w-5", TIER_TEXT[tier])} />
            Strength Tier · <span className={TIER_TEXT[tier]}>{TIER_LABEL[tier]}</span>
          </DialogTitle>
        </DialogHeader>
        <DialogDescription asChild>
          <div className="space-y-3 text-sm text-foreground/80">
            <p>
              A day qualifies when you log at least <b>{STRENGTH_TIER.qualifierReps} combined reps</b> or{" "}
              <b>{STRENGTH_TIER.qualifierSeconds} seconds of combined holds</b>. You can split across any
              exercises — pull-ups, squats, planks, handstands, whatever.
            </p>
            <p>
              Your tier is the count of qualifying days in the rolling last 7. No streak to break — miss a
              day and your tier just drops one notch.
            </p>
            <div className="rounded-lg border border-border bg-secondary/40 p-3 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[hsl(28_70%_55%)] font-semibold">Bronze · {STRENGTH_TIER.bronzeDays}–{STRENGTH_TIER.silverDays - 1} days</span>
                <span>+{STRENGTH_TIER.bronzeChalkPct}% chalk</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[hsl(0_0%_82%)] font-semibold">Silver · {STRENGTH_TIER.silverDays}–{STRENGTH_TIER.goldDays - 1} days</span>
                <span>+{STRENGTH_TIER.silverChalkPct}% chalk</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-legendary font-semibold">Gold · {STRENGTH_TIER.goldDays} days</span>
                <span>+{STRENGTH_TIER.goldChalkPct}% chalk · +{STRENGTH_TIER.goldCritPct}% crit</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              You're at <b className="text-foreground">{qualifiedDays}/7</b> qualifying days right now.
              Bonuses apply to every chalk earning — boulders, bosses, and strength sessions.
            </p>
            <p className="text-[11px] text-muted-foreground italic">{tierThresholdsLabel()}</p>
          </div>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}

/** Compact chip — used inline (e.g. dashboard hero). */
export function StrengthTierChip({
  sessions, onClick,
}: { sessions: StrengthSession[]; onClick?: () => void }) {
  const { tier } = tierFor(sessions);
  const pct = tierChalkPct(tier);
  if (tier === "none") return null;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border border-current/30 bg-current/5 font-bold",
        TIER_TEXT[tier],
      )}
      title={`Strength tier · ${TIER_LABEL[tier]} · +${pct}% chalk`}
    >
      <Dumbbell className="h-3 w-3" />
      {TIER_LABEL[tier]} +{pct}%
    </button>
  );
}
