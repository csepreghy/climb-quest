import { GameCard } from "@/components/ui/game-card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { RARITY_BORDER, ShopItem } from "@/game/data";
import { isImageEmoji } from "@/game/customItems";
import { SmartImage } from "@/components/SmartImage";
import { ChalkBagLoader } from "@/components/ChalkBagLoader";
import { ItemCard } from "@/components/ItemCard";
import { BuddyCard } from "@/components/BuddyCard";
import { cn } from "@/lib/utils";
import { Check, Trash2 } from "lucide-react";

/**
 * Super-compact, image-only tile for the Inventory "Owned" grid.
 * No name, no description, no per-tile action buttons — click to open the
 * existing compare/equip modal for full details.
 */
export function InventoryTile({
  item,
  onClick,
  equipped,
  primed,
  onRemove,
}: {
  item: ShopItem;
  onClick?: () => void;
  equipped?: boolean;
  primed?: boolean;
  onRemove?: () => void;
}) {
  const tone = item.rarity === "legendary" ? "legendary" : item.rarity === "rare" ? "rare" : "default";

  const bonusPct = item.bonus?.mult ? Math.round(item.bonus.mult * 100) : 0;
  const consumablePct = item.consumableBonus ? Math.round(item.consumableBonus * 100) : 0;
  const chalkPct = bonusPct || consumablePct;
  const discountPct = item.priceMult && item.priceMult < 1 ? Math.round((1 - item.priceMult) * 100) : 0;
  const critPct = item.critChancePct ? Math.round(item.critChancePct) : 0;
  const bossPct = item.bossBonusPct ? Math.round(item.bossBonusPct) : 0;
  const badges: { text: string; cls: string }[] = [];
  if (chalkPct > 0) badges.push({ text: `+${chalkPct}%`, cls: "bg-chalk-glow/90 text-background border-chalk-glow" });
  if (discountPct > 0) badges.push({ text: `−${discountPct}%`, cls: "bg-[hsl(var(--btn-orange))]/90 text-background border-[hsl(var(--btn-orange))]" });
  if (critPct > 0) badges.push({ text: `${critPct}%c`, cls: "bg-[hsl(var(--epic))]/90 text-background border-[hsl(var(--epic))]" });
  if (bossPct > 0) badges.push({ text: `+${bossPct}%b`, cls: "bg-legendary/90 text-background border-legendary" });

  return (
  const isBuddy = item.group === "buddy";

  const tile = (
    <GameCard
      tone={tone as "default"}
      shimmer={item.rarity === "legendary"}
      interactive={!!onClick}
      className={cn(
        "p-1.5 relative overflow-hidden transition-transform duration-200",
        onClick && "cursor-pointer hover:-translate-y-0.5 hover:ring-2 hover:ring-[hsl(var(--btn-orange))]/60",
      )}
      onClick={onClick}
      title={item.name}
      aria-label={item.name}
    >
      <div className={cn("relative aspect-square w-full overflow-hidden rounded-md bg-background/40", RARITY_BORDER[item.rarity])}>
        {isImageEmoji(item.emoji) ? (
          <SmartImage src={item.emoji} alt={item.name} loaderSize={24} wrapperClassName="h-full w-full" className="h-full w-full object-contain p-1" />
        ) : item.emoji ? (
          <div className="h-full w-full flex items-center justify-center text-3xl sm:text-4xl">{item.emoji}</div>
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <ChalkBagLoader size={24} />
          </div>
        )}

        {badges.length > 0 && (
          <div className="absolute top-1 right-1 flex flex-col items-end gap-0.5 max-w-[80%] pointer-events-none">
            {badges.map((b, i) => (
              <span
                key={i}
                className={cn(
                  "text-[9px] leading-none font-bold tabular-nums px-1 py-0.5 rounded border whitespace-nowrap shadow-sm",
                  b.cls,
                )}
              >
                {b.text}
              </span>
            ))}
          </div>
        )}

        {(equipped || primed) && (
          <div
            className={cn(
              "absolute bottom-1 right-1 h-5 w-5 grid place-items-center rounded-full border shadow",
              primed ? "bg-chalk-glow text-background border-chalk-glow" : "bg-foreground text-background border-foreground",
            )}
            title={primed ? "Primed" : "Equipped"}
          >
            <Check className="h-3 w-3" strokeWidth={3} />
          </div>
        )}

        {onRemove && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            aria-label="Remove from inventory"
            title="Remove from inventory (admin)"
            className="absolute bottom-1 left-1 h-5 w-5 grid place-items-center rounded-md border border-destructive/60 text-destructive bg-background/80 hover:bg-destructive hover:text-destructive-foreground transition"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
    </GameCard>
  );

  return (
    <HoverCard openDelay={120} closeDelay={60}>
      <HoverCardTrigger asChild>{tile}</HoverCardTrigger>
      <HoverCardContent
        side="top"
        align="center"
        sideOffset={8}
        className={cn("p-0 border-0 bg-transparent shadow-none hidden md:block", isBuddy ? "w-[420px]" : "w-72")}
      >
        {isBuddy ? <BuddyCard item={item} /> : <ItemCard item={item} primed={primed} />}
      </HoverCardContent>
    </HoverCard>
  );
}
