import { GameCard } from "@/components/ui/game-card";
import { GameButton } from "@/components/ui/game-button";
import { RARITY_COLOR, RARITY_BORDER, ShopItem } from "@/game/data";
import { isImageEmoji } from "@/game/customItems";
import { SmartImage } from "@/components/SmartImage";
import { ChalkBagLoader } from "@/components/ChalkBagLoader";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import chalkBagImg from "@/assets/chalk-bag.png";

export function ItemCard({
  item,
  showAction,
  actionLabel,
  onAction,
  onClick,
  primed,
  highlight,
  onRemove,
  onSell,
  sellPrice,
}: {
  item: ShopItem;
  showAction?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  onClick?: () => void;
  primed?: boolean;
  highlight?: boolean;
  onRemove?: () => void;
  onSell?: () => void;
  sellPrice?: number;
}) {
  const tone = item.rarity === "legendary" ? "legendary" : item.rarity === "rare" ? "rare" : "default";
  const bonusPct = item.bonus?.mult ? Math.round(item.bonus.mult * 100) : 0;
  const consumablePct = item.consumableBonus ? Math.round(item.consumableBonus * 100) : 0;
  const chalkPct = bonusPct || consumablePct;
  const discountPct = item.priceMult && item.priceMult < 1 ? Math.round((1 - item.priceMult) * 100) : 0;
  const critPct = item.critChancePct ? Math.round(item.critChancePct) : 0;
  const bossPct = item.bossBonusPct ? Math.round(item.bossBonusPct) : 0;
  const badges: { text: string; cls: string }[] = [];
  if (chalkPct > 0) badges.push({ text: `+${chalkPct}%`, cls: "bg-chalk-glow/15 text-chalk-glow border-chalk-glow/40" });
  if (discountPct > 0) badges.push({ text: `−${discountPct}%`, cls: "bg-[hsl(var(--btn-orange))]/15 text-[hsl(var(--btn-orange))] border-[hsl(var(--btn-orange))]/40" });
  if (critPct > 0) badges.push({ text: `${critPct}% crit`, cls: "bg-[hsl(var(--epic))]/15 text-[hsl(var(--epic))] border-[hsl(var(--epic))]/50" });
  if (bossPct > 0) badges.push({ text: `+${bossPct}% boss`, cls: "bg-legendary/15 text-legendary border-legendary/40" });
  return (
    <GameCard
      tone={tone as "default"}
      shimmer={item.rarity === "legendary"}
      interactive={!!onClick}
      className={cn("p-4 flex flex-col gap-3 relative", onClick && "cursor-pointer", highlight && "ring-2 ring-[hsl(var(--btn-orange))]/60")}
      onClick={onClick}
    >
      {badges.length > 0 && (
        <div className="absolute top-2 right-2 z-10 flex flex-col items-end gap-0.5">
          {badges.map((b, i) => (
            <div key={i} className={cn("text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-md border whitespace-nowrap", b.cls)}>
              {b.text}
            </div>
          ))}
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
      <div className={cn("flex items-start gap-3", badges.length > 0 && "pr-[92px]")}>
        {isImageEmoji(item.emoji) ? (
          <SmartImage src={item.emoji} alt={item.name} loaderSize={36} wrapperClassName={cn("h-20 w-20 shrink-0 rounded-lg bg-background/40 p-1", RARITY_BORDER[item.rarity])} className="h-full w-full object-contain" />
        ) : item.emoji ? (
          <div className={cn("text-5xl h-20 w-20 flex items-center justify-center rounded-lg bg-background/40 shrink-0", RARITY_BORDER[item.rarity])}>{item.emoji}</div>
        ) : (
          <div className={cn("h-20 w-20 flex items-center justify-center rounded-lg bg-background/40 shrink-0", RARITY_BORDER[item.rarity])}>
            <ChalkBagLoader size={36} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium leading-snug">{item.name}</div>
          <div className={cn("text-[10px] uppercase tracking-wider inline-block mt-1 px-1.5 py-0.5 rounded border", RARITY_COLOR[item.rarity])}>
            {item.rarity}
          </div>
          {primed && <div className="mt-1 text-[10px] uppercase tracking-wider text-chalk-glow">Primed</div>}
        </div>
      </div>
      {item.desc && <p className="text-xs text-muted-foreground flex-1 leading-relaxed">{item.desc}</p>}
      {(showAction || onSell) && (
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
          {onSell && typeof sellPrice === "number" && sellPrice > 0 && (
            <GameButton size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onSell(); }} title="Sell for half price">
              <img src={chalkBagImg} alt="" className="h-3.5 w-3.5 object-contain" /> Sell · {sellPrice.toLocaleString()}
            </GameButton>
          )}
          {showAction && (
            <GameButton size="sm" variant="primary" onClick={(e) => { e.stopPropagation(); onAction?.(); }}>
              {actionLabel ?? "Equip"}
            </GameButton>
          )}
        </div>
      )}
    </GameCard>
  );
}
