import { GameCard } from "@/components/ui/game-card";
import { useGame } from "@/game/store";
import { useDailyCapConfig, computeDailyCap, currentStreak, chalkUsedOnDate } from "@/game/dailyCap";
import { cn } from "@/lib/utils";
import { Flame } from "lucide-react";

export function DailyCapBar({ className }: { className?: string }) {
  const s = useGame();
  const cfg = useDailyCapConfig();
  if (!cfg.enabled) return null;
  const streak = currentStreak(s);
  const cap = computeDailyCap(s.level, streak, cfg);
  const used = chalkUsedOnDate(s, new Date().toISOString());
  const pct = cap > 0 ? used / cap : 0;
  const overTier1 = pct >= cfg.tier1Threshold;
  const overTier2 = pct >= cfg.tier2Threshold;
  const fillPct = Math.min(100, pct * 100);
  const fillCls = overTier2
    ? "bg-muted-foreground"
    : overTier1
      ? "bg-[hsl(var(--btn-orange))]"
      : "bg-chalk-glow";
  const stateLabel = overTier2
    ? `Diminishing returns ×${cfg.tier2Mult}`
    : overTier1
      ? `Diminishing returns ×${cfg.tier1Mult}`
      : "Full chalk";
  return (
    <GameCard className={cn("p-3", className)}>
      <div className="flex items-center justify-between gap-3 mb-1.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="uppercase tracking-wider text-muted-foreground">Daily cap</span>
          <span className="tabular-nums font-medium">{used.toLocaleString()} / {cap.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className={cn(overTier1 ? "text-[hsl(var(--btn-orange))]" : "text-chalk-glow")}>{stateLabel}</span>
          {streak > 0 && (
            <span className="flex items-center gap-1 text-[hsl(var(--btn-orange))]">
              <Flame className="h-3 w-3" />{streak}d
            </span>
          )}
        </div>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden relative">
        <div className={cn("h-full transition-all", fillCls)} style={{ width: `${fillPct}%` }} />
      </div>
      <div className="mt-1 text-[10px] text-muted-foreground">
        Past {Math.round(cfg.tier1Threshold * 100)}% of cap, chalk earns ×{cfg.tier1Mult}; past {Math.round(cfg.tier2Threshold * 100)}%, ×{cfg.tier2Mult}.
      </div>
    </GameCard>
  );
}
