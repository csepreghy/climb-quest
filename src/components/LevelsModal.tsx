import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { LEVELS, Gender } from "@/game/data";
import { resolvedLevel, useLevelOverrides } from "@/game/levelOverrides";
import { Lock, Check, ArrowUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { GameButton } from "@/components/ui/game-button";
import chalkBagImg from "@/assets/chalk-bag.png";

export function LevelsModal({
  open,
  onOpenChange,
  currentLevel,
  gender,
  canLevelUp,
  nextCost,
  onLevelUpClick,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentLevel: number;
  gender: Gender;
  canLevelUp?: boolean;
  nextCost?: number;
  onLevelUpClick?: () => void;
}) {
  useLevelOverrides();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[hsl(var(--btn-orange))]" />
            Climber Levels
          </DialogTitle>
          <DialogDescription>Earn Chalk by logging climbs to ascend the ranks.</DialogDescription>
        </DialogHeader>

        {onLevelUpClick && (
          <div className="flex items-center justify-end gap-3">
            {canLevelUp && (
              <span className="inline-flex items-center gap-1.5 text-sm font-bold tabular-nums">
                {nextCost?.toLocaleString()}
                <img src={chalkBagImg} alt="Chalk" className="h-5 w-5 object-contain" />
              </span>
            )}
            <GameButton
              variant={canLevelUp ? "primary" : "ghost"}
              size="md"
              disabled={!canLevelUp}
              onClick={onLevelUpClick}
            >
              <ArrowUp className="h-4 w-4" />
              Level Up
            </GameButton>
          </div>
        )}

        <div className="space-y-3 overflow-y-auto pr-1 -mr-1">
          {LEVELS.map(base => {
            const l = resolvedLevel(base.level, gender);
            const past = l.level < currentLevel;
            const cur = l.level === currentLevel;
            const future = l.level > currentLevel;
            return (
              <div
                key={l.level}
                className={cn(
                  "rounded-xl border-2 p-3 sm:p-4 flex gap-3 sm:gap-4 transition",
                  cur && "border-[hsl(var(--btn-orange))] bg-[hsl(var(--btn-orange))]/10 shadow-[0_0_0_1px_hsl(var(--btn-orange)/0.4),0_8px_24px_-12px_hsl(var(--btn-orange)/0.5)]",
                  past && "border-chalk-glow/30 bg-chalk-glow/5",
                  future && "border-border bg-secondary/40 opacity-90",
                )}
              >
                <div className={cn(
                  "shrink-0 h-20 w-20 sm:h-24 sm:w-24 rounded-lg flex items-center justify-center overflow-hidden border-2",
                  cur ? "border-[hsl(var(--btn-orange))] bg-background/60" : past ? "border-chalk-glow/40 bg-background/40" : "border-border bg-background/30",
                )}>
                  {l.image ? (
                    <img src={l.image} alt={l.title} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-4xl sm:text-5xl">{l.emoji}</span>
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Level {l.level}</div>
                      <div className="font-display font-bold text-base sm:text-lg leading-tight truncate">{l.title}</div>
                    </div>
                    <div className="shrink-0 flex items-center gap-1.5">
                      {cur && <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[hsl(var(--btn-orange))] text-white">Current</span>}
                      {past && <Check className="h-4 w-4 text-chalk-glow" />}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground italic line-clamp-2">{l.desc}</p>

                  {l.unlocks.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {l.unlocks.map(u => (
                        <span
                          key={u}
                          className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded border",
                            past || cur
                              ? "border-chalk-glow/40 text-chalk-glow bg-chalk-glow/10"
                              : "border-border text-muted-foreground bg-background/40",
                          )}
                        >
                          {u}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="pt-1 text-xs">
                    {past ? (
                      <span className="text-chalk-glow inline-flex items-center gap-1"><Check className="h-3 w-3" /> Unlocked</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 tabular-nums text-muted-foreground">
                        {future && <Lock className="h-3 w-3" />}
                        <span className={cn("font-bold", cur && "text-[hsl(var(--btn-orange))]")}>{l.cost.toLocaleString()}</span>
                        <img src={chalkBagImg} alt="Chalk" className="h-3.5 w-3.5 object-contain" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
