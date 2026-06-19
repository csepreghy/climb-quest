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
  footer?: React.ReactNode;
}) {
  const tone = item.rarity === "legendary" ? "legendary" : item.rarity === "rare" ? "rare" : "default";
  const bonusPct = item.bonus?.mult ? Math.round(item.bonus.mult * 100) : 0;

  return (
    <GameCard
      tone={tone as "default"}
      shimmer={item.rarity === "legendary"}
      interactive={!!onClick}
      className={cn(
        "p-3 relative overflow-hidden",
        onClick && "cursor-pointer",
        highlight && "ring-2 ring-[hsl(var(--btn-orange))]/60"
      )}
      onClick={onClick}
    >
      <div className="flex gap-5">
        {/* Image — pushed to the left, slightly smaller than before */}
        <div className={cn("h-32 w-32 sm:h-36 sm:w-36 shrink-0 rounded-xl bg-background/40 overflow-hidden", RARITY_BORDER[item.rarity])}>
          {isImageEmoji(item.emoji) ? (
            <SmartImage
              src={item.emoji}
              alt={item.name}
              loaderSize={48}
              wrapperClassName="h-full w-full"
              className="h-full w-full object-cover"
            />
          ) : item.emoji ? (
            <div className="h-full w-full flex items-center justify-center text-5xl sm:text-6xl">{item.emoji}</div>
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <ChalkBagLoader size={48} />
            </div>
          )}
        </div>

        {/* Details — right side */}
        <div className="min-w-0 flex-1 flex flex-col gap-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="text-base font-semibold leading-snug break-words">{item.name}</div>
              <div className={cn("text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border inline-block mt-1", RARITY_COLOR[item.rarity])}>
                {item.rarity}
              </div>
            </div>
            <div className="shrink-0 flex flex-col items-end gap-1">
              {bonusPct > 0 && (
                <div className="text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-md border bg-chalk-glow/15 text-chalk-glow border-chalk-glow/40 whitespace-nowrap">
                  +{bonusPct}%
                </div>
              )}
              {onRemove && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onRemove(); }}
                  aria-label="Remove from inventory"
                  title="Remove from inventory (admin)"
                  className="h-7 w-7 grid place-items-center rounded-md border border-destructive/40 text-destructive bg-background/70 hover:bg-destructive hover:text-destructive-foreground transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {item.desc && <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{item.desc}</p>}

          {showAction && (
            <div className="flex items-center justify-end mt-auto pt-2">
              <GameButton size="sm" variant="primary" onClick={(e) => { e.stopPropagation(); onAction?.(); }}>
                {actionLabel ?? "Equip"}
              </GameButton>
            </div>
          )}

          {footer && <div className="mt-auto pt-2">{footer}</div>}
        </div>
      </div>
    </GameCard>
  );
}
