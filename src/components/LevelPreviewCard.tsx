import { cn } from "@/lib/utils";
import { ClimberAvatar } from "@/components/ClimberAvatar";

export function LevelPreviewCard({
  title,
  desc,
  level,
  gender,
  equipped,
  ringClass,
  badgeLabel,
  badgeClass,
  unlocks,
  unlocksLabel,
  cost,
}: {
  title: string;
  desc: string;
  level: number;
  gender: "male" | "female";
  equipped: Record<string, string | null>;
  ringClass: string;
  badgeLabel: string;
  badgeClass: string;
  unlocks: string[];
  unlocksLabel: string;
  cost?: number;
}) {
  return (
    <div
      className={cn(
        "rounded-xl text-left border-2 border-[hsl(var(--panel-frame))] bg-secondary/50 overflow-hidden ring-2",
        "shadow-[inset_0_2px_0_hsl(0_0%_100%/0.06),inset_0_-3px_0_hsl(0_0%_0%/0.4),0_8px_18px_-10px_hsl(0_0%_0%/0.6)]",
        ringClass,
      )}
    >
      <div className="aspect-square w-full bg-black/60 flex items-center justify-center relative">
        <ClimberAvatar level={level} gender={gender} equipped={equipped as any} size="xl" />
        <span className={cn("absolute top-2 right-2 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full", badgeClass)}>
          {badgeLabel}
        </span>
      </div>
      <div className="p-4">
        <div className="font-display font-bold text-lg">{title}</div>
        <div className="text-xs text-muted-foreground italic mt-1 leading-snug">"{desc}"</div>
        {cost !== undefined && (
          <div className="text-xs mt-2">
            Cost: <span className="font-bold gradient-chalk-text tabular-nums">{cost.toLocaleString()} Chalk</span>
          </div>
        )}
        {unlocks?.length > 0 && (
          <div className="mt-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{unlocksLabel}</div>
            <ul className="space-y-0.5">
              {unlocks.map(u => (
                <li key={u} className="text-xs text-foreground/90 flex gap-1.5">
                  <span className="text-[hsl(var(--btn-orange))]">▸</span>{u}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
