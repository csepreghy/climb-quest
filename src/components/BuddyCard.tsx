import { GameCard } from "@/components/ui/game-card";
import { GameButton } from "@/components/ui/game-button";
import { RARITY_COLOR, RARITY_BORDER, ShopItem } from "@/game/data";
import { isImageEmoji } from "@/game/customItems";
import { SmartImage } from "@/components/SmartImage";
import { ChalkBagLoader } from "@/components/ChalkBagLoader";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";

/** Larger, image-forward card for Climbing Buddies. */
export function BuddyCard({
  item,
  showAction,
  actionLabel,
  onAction,
  onClick,
  highlight,
  onRemove,
  footer,
}: {
  item: ShopItem;
  showAction?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  onClick?: () => void;
  highlight?: boolean;
  onRemove?: () => void;
  /** Optional footer (e.g. shop price + buy button). */
  footer?: React.ReactNode;
}) {
  const tone = item.rarity === "legendary" ? "legendary" : item.rarity === "rare" ? "rare" : "default";

  return (
    <GameCard
      tone={tone as "default"}
      shimmer={item.rarity === "legendary"}
      interactive={!!onClick}
      className={cn(
        "p-4 flex flex-col gap-3 relative",
        onClick && "cursor-pointer",
        highlight && "ring-2 ring-[hsl(var(--btn-orange))]/60"
      )}
      onClick={onClick}
    >
      {onRemove && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          aria-label="Remove from inventory"
          title="Remove from inventory (admin)"
          className="absolute top-2 right-2 z-10 h-7 w-7 grid place-items-center rounded-md border border-destructive/40 text-destructive bg-background/70 hover:bg-destructive hover:text-destructive-foreground transition"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Image — capped at ~3× standard item thumbnail (80px) */}
      <div className={cn("h-40 w-40 sm:h-48 sm:w-48 mx-auto rounded-xl bg-background/40 overflow-hidden p-2", RARITY_BORDER[item.rarity])}>
        {isImageEmoji(item.emoji) ? (
          <SmartImage
            src={item.emoji}
            alt={item.name}
            loaderSize={56}
            wrapperClassName="h-full w-full"
            className="h-full w-full object-contain"
          />
        ) : item.emoji ? (
          <div className="h-full w-full flex items-center justify-center text-6xl sm:text-7xl">{item.emoji}</div>
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <ChalkBagLoader size={56} />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-base font-semibold leading-snug truncate">{item.name}</div>
        <div className={cn("text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0", RARITY_COLOR[item.rarity])}>
          {item.rarity}
        </div>
      </div>

      {item.desc && <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>}

      {showAction && (
        <div className="flex items-center justify-end pt-2 border-t border-border/50">
          <GameButton size="sm" variant="primary" onClick={(e) => { e.stopPropagation(); onAction?.(); }}>
            {actionLabel ?? "Equip"}
          </GameButton>
        </div>
      )}

      {footer && <div className="pt-2 border-t border-border/50">{footer}</div>}
    </GameCard>
  );
}
