import { GameCard } from "@/components/ui/game-card";
import { GameButton } from "@/components/ui/game-button";
import { RARITY_COLOR, RARITY_BORDER, ShopItem } from "@/game/data";
import { isImageEmoji } from "@/game/customItems";
import { SmartImage } from "@/components/SmartImage";
import { ChalkBagLoader } from "@/components/ChalkBagLoader";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";

export function ItemCard({
  item,
  showAction,
  actionLabel,
  onAction,
  onClick,
  primed,
  highlight,
  onRemove,
}: {
  item: ShopItem;
  showAction?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  onClick?: () => void;
  primed?: boolean;
  highlight?: boolean;
  onRemove?: () => void;
}) {
  const tone = item.rarity === "legendary" ? "legendary" : item.rarity === "rare" ? "rare" : "default";
  const bonusPct = item.bonus?.mult ? Math.round(item.bonus.mult * 100) : 0;
  const consumablePct = item.consumableBonus ? Math.round(item.consumableBonus * 100) : 0;
  const showPct = bonusPct || consumablePct;
  return (
    <GameCard
      tone={tone as "default"}
      shimmer={item.rarity === "legendary"}
      interactive={!!onClick}
      className={cn("p-4 flex flex-col gap-3 relative", onClick && "cursor-pointer", highlight && "ring-2 ring-[hsl(var(--btn-orange))]/60")}
      onClick={onClick}
    >
      {showPct > 0 && (
        <div className="absolute top-0 right-0 z-10 text-[11px] font-bold tabular-nums px-2 py-0.5 rounded-md bg-chalk-glow/15 text-chalk-glow border border-chalk-glow/40">
          +{showPct}%
        </div>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          aria-label="Remove from inventory"
          title="Remove from inventory (admin)"
          className="absolute bottom-2 right-2 z-10 h-7 w-7 grid place-items-center rounded-md border border-destructive/40 text-destructive bg-background/70 hover:bg-destructive hover:text-destructive-foreground transition"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
      <div className="flex items-start gap-3">
        {isImageEmoji(item.emoji) ? (
          <SmartImage src={item.emoji} alt={item.name} loaderSize={36} wrapperClassName={cn("h-20 w-20 shrink-0 rounded-lg bg-background/40 p-1", RARITY_BORDER[item.rarity])} className="h-full w-full object-contain" />
        ) : item.emoji ? (
          <div className={cn("text-5xl h-20 w-20 flex items-center justify-center rounded-lg bg-background/40 shrink-0", RARITY_BORDER[item.rarity])}>{item.emoji}</div>
        ) : (
          <div className={cn("h-20 w-20 flex items-center justify-center rounded-lg bg-background/40 shrink-0", RARITY_BORDER[item.rarity])}>
            <ChalkBagLoader size={36} />
          </div>
        )}
        <div className="min-w-0 flex-1 pr-12">
          <div className="text-sm font-medium leading-snug">{item.name}</div>
          <div className={cn("text-[10px] uppercase tracking-wider inline-block mt-1 px-1.5 py-0.5 rounded border", RARITY_COLOR[item.rarity])}>
            {item.rarity}
          </div>
          {primed && <div className="mt-1 text-[10px] uppercase tracking-wider text-chalk-glow">Primed</div>}
        </div>
      </div>
      {item.desc && <p className="text-xs text-muted-foreground flex-1 leading-relaxed">{item.desc}</p>}
      {showAction && (
        <div className="flex items-center justify-end pt-2 border-t border-border/50">
          <GameButton size="sm" variant="primary" onClick={(e) => { e.stopPropagation(); onAction?.(); }}>
            {actionLabel ?? "Equip"}
          </GameButton>
        </div>
      )}
    </GameCard>
  );
}
