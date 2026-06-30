import { ShopItem } from "@/game/data";
import { isImageEmoji } from "@/game/customItems";
import { SmartImage } from "@/components/SmartImage";
import { ChalkBagLoader } from "@/components/ChalkBagLoader";
import { cn } from "@/lib/utils";
import chalkBagImg from "@/assets/chalk-bag.png";

/**
 * Presentational, non-interactive shop tile that mirrors the redesigned
 * shop tile look (.tile-3d). Used on the public landing page.
 */
export function ShopPreviewTile({ item, className, smallImage, hidePrice, footer }: { item: ShopItem; className?: string; smallImage?: boolean; hidePrice?: boolean; footer?: React.ReactNode }) {
  const bonusPct = item.bonus?.mult ? Math.round(item.bonus.mult * 100) : 0;
  const consumablePct = item.consumableBonus ? Math.round(item.consumableBonus * 100) : 0;
  const chalkPct = bonusPct || consumablePct;
  const discountPct = item.priceMult && item.priceMult < 1 ? Math.round((1 - item.priceMult) * 100) : 0;
  const critPct = item.critChancePct ? Math.round(item.critChancePct) : 0;
  const bossPct = item.bossBonusPct ? Math.round(item.bossBonusPct) : 0;
  const boardPct = item.boardBonusPct ? Math.round(item.boardBonusPct) : 0;

  const badges: { text: string; cls: string }[] = [];
  if (chalkPct > 0) badges.push({ text: `+${chalkPct}%`, cls: "bg-chalk-glow/90 text-background border-chalk-glow" });
  if (discountPct > 0) badges.push({ text: `−${discountPct}%`, cls: "bg-[hsl(var(--shop-discount))]/95 text-black border-[hsl(var(--shop-discount))]" });
  if (critPct > 0) badges.push({ text: `+${critPct}%`, cls: "bg-[hsl(var(--epic))]/90 text-background border-[hsl(var(--epic))]" });
  if (bossPct > 0) badges.push({ text: `+${bossPct}%`, cls: "bg-legendary/90 text-background border-legendary" });
  if (boardPct > 0) badges.push({ text: `+${boardPct}%`, cls: "bg-[hsl(var(--board-bonus))]/90 text-background border-[hsl(var(--board-bonus))]" });

  return (
    <div
      title={item.name}
      aria-label={item.name}
      className={cn("tile-3d relative aspect-square w-full overflow-hidden", className)}
    >
      {isImageEmoji(item.emoji) ? (
        <SmartImage 
          src={item.emoji} 
          alt={item.name} 
          loaderSize={smallImage ? 16 : 24} 
          wrapperClassName="h-full w-full flex items-center justify-center" 
          className={cn("object-contain", smallImage ? "h-[60%] w-[60%] -translate-y-1.5" : "h-full w-full object-cover")} 
        />
      ) : item.emoji ? (
        <div className={cn("h-full w-full flex items-center justify-center", smallImage ? "text-xl sm:text-2xl -translate-y-1.5" : "text-3xl sm:text-4xl")}>{item.emoji}</div>
      ) : (
        <div className="h-full w-full flex items-center justify-center">
          <ChalkBagLoader size={smallImage ? 16 : 24} />
        </div>
      )}

      {footer ? (
        <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1 bg-gradient-to-t from-black/85 via-black/55 to-transparent pointer-events-none">
          {footer}
        </div>
      ) : !hidePrice ? (
        <div className="absolute bottom-0 left-0 right-0 flex items-center gap-1 px-1.5 py-1 bg-gradient-to-t from-black/80 via-black/50 to-transparent pointer-events-none">
          <img src={chalkBagImg} alt="" className="h-3.5 w-3.5 object-contain drop-shadow" />
          <span className="text-[12px] leading-none font-extrabold tabular-nums text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]">
            {item.price.toLocaleString()}
          </span>
        </div>
      ) : null}

      {badges.length > 0 && (
        <div className="absolute top-1 right-1 flex flex-col items-end gap-0.5 max-w-[80%] pointer-events-none">
          {badges.map((b, i) => (
            <span key={i} className={cn("text-[9px] leading-none font-bold tabular-nums px-1 py-0.5 rounded border whitespace-nowrap shadow-sm", b.cls)}>
              {b.text}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
