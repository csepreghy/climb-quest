import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { LEVELS, Gender } from "@/game/data";
import { resolvedLevel, useLevelOverrides } from "@/game/levelOverrides";
import { Lock, Check, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { GameButton } from "@/components/ui/game-button";

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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Levels</DialogTitle>
          <DialogDescription>Earn Chalk to climb the ranks.</DialogDescription>
        </DialogHeader>
        {onLevelUpClick && (
          <GameButton
            variant={canLevelUp ? "primary" : "ghost"}
            size="sm"
            disabled={!canLevelUp}
            onClick={onLevelUpClick}
            className="w-full"
          >
            <ArrowUp className="h-4 w-4" />
            {canLevelUp ? `Level Up (${nextCost?.toLocaleString()} Chalk)` : "Need more Chalk to level up"}
          </GameButton>
        )}
        <div className="rounded-lg border border-border divide-y divide-border/60 overflow-hidden max-h-[60vh] overflow-y-auto">
          {LEVELS.map(base => {
            const l = resolvedLevel(base.level, gender);
            const past = l.level < currentLevel;
            const cur = l.level === currentLevel;
            const future = l.level > currentLevel;
            return (
              <div key={l.level} className={cn("flex items-center gap-3 px-3 py-2.5", cur && "bg-accent/10")}>
                <div className="text-xl w-8 text-center">
                  {l.image ? <img src={l.image} alt="" className="h-8 w-8 object-contain rounded" /> : l.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold flex items-center gap-2">
                    Lv {l.level} · {l.title}
                    {cur && <span className="text-[10px] uppercase px-1.5 rounded bg-accent/20 text-accent">Current</span>}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">{l.desc}</div>
                </div>
                <div className="text-right text-xs tabular-nums">
                  {past ? <Check className="h-4 w-4 text-chalk-glow" /> : future ? (
                    <span className="flex items-center gap-1 text-muted-foreground"><Lock className="h-3 w-3" /> {l.cost.toLocaleString()}</span>
                  ) : <span className="text-muted-foreground">{l.cost.toLocaleString()}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
