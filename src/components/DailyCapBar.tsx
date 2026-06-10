import { GameCard } from "@/components/ui/game-card";
import { useGame } from "@/game/store";
import { useDailyCapConfig, computeDailyCap, chalkUsedOnDate, currentStreak } from "@/game/dailyCap";
import { useStreakConfig, streakDayBonusPct, cycleDay, activeBuffs, activeCapBuffPct } from "@/game/streak";
import { StrengthTierStrip } from "@/components/StrengthTierStrip";
import { cn } from "@/lib/utils";
import { Flame, Zap, Target, ShieldPlus } from "lucide-react";

export function DailyCapBar({ className }: { className?: string }) {
  const s = useGame();
  const cfg = useDailyCapConfig();
  const streakCfg = useStreakConfig();
  if (!cfg.enabled) return null;

  const streak = currentStreak(s);
  const capBase = computeDailyCap(s.level, cfg);
  const capBuff = activeCapBuffPct(s);
  const cap = Math.round(capBase * (1 + capBuff / 100));
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
      : null;

  const dayBonus = streakDayBonusPct(streak, streakCfg);
  const currentCycleDay = cycleDay(streak);
  const buffs = activeBuffs(s);

  return (
    <GameCard className={cn("p-3", className)}>
      {/* Streak strip */}
      {streakCfg.enabled && (
        <div className="mb-2.5">
          <div className="flex items-center justify-between gap-2 mb-1.5 text-xs">
            <div className="flex items-center gap-1.5">
              <Flame className={cn("h-3.5 w-3.5", streak > 0 ? "text-[hsl(var(--btn-orange))]" : "text-muted-foreground")} />
              <span className="uppercase tracking-wider text-muted-foreground">Streak</span>
              <span className="tabular-nums font-medium">{streak}d</span>
            </div>
            {dayBonus > 0 && (
              <span className={cn(
                "tabular-nums font-bold",
                currentCycleDay === 7 ? "text-[hsl(var(--btn-orange))]" : "text-chalk-glow",
              )}>
                +{dayBonus}% chalk today
              </span>
            )}
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 7 }, (_, i) => {
              const dayNum = i + 1;
              const filled = currentCycleDay >= dayNum && streak > 0;
              const isDay7 = dayNum === 7;
              return (
                <div
                  key={i}
                  className={cn(
                    "flex-1 h-1.5 rounded-full transition",
                    filled
                      ? isDay7 ? "bg-[hsl(var(--btn-orange))]" : "bg-chalk-glow"
                      : isDay7 ? "bg-[hsl(var(--btn-orange))]/15" : "bg-secondary",
                  )}
                />
              );
            })}
          </div>
          {streak >= 7 && (
            <div className="mt-1 text-[10px] text-muted-foreground">
              Cycle resets every 7 days · counter caps at 30
            </div>
          )}
        </div>
      )}

      {/* Active buff chips */}
      {buffs.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {buffs.map(b => {
            const Icon = b.kind === "chalk" ? Zap : b.kind === "crit" ? Target : ShieldPlus;
            const hrs = Math.max(0, Math.round((new Date(b.expiresAt).getTime() - Date.now()) / 3600000));
            const remain = hrs >= 24 ? `${Math.round(hrs / 24)}d` : `${hrs}h`;
            return (
              <span
                key={b.id}
                className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border border-chalk-glow/40 bg-chalk-glow/10 text-chalk-glow"
                title={b.source ?? ""}
              >
                <Icon className="h-3 w-3" />
                +{b.pct}% {b.kind} · {remain}
              </span>
            );
          })}
        </div>
      )}

      {/* Daily cap bar */}
      <div className="flex items-center justify-between gap-3 mb-1.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="uppercase tracking-wider text-muted-foreground">Daily cap</span>
          <span className="tabular-nums font-medium">
            {used.toLocaleString()} / {cap.toLocaleString()}
            {capBuff > 0 && <span className="ml-1 text-chalk-glow">(+{capBuff}%)</span>}
          </span>
        </div>
        {stateLabel && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className={cn(overTier1 ? "text-[hsl(var(--btn-orange))]" : "text-chalk-glow")}>{stateLabel}</span>
          </div>
        )}
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
