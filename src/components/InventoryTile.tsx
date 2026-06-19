import { useRef, useState } from "react";
import { RARITY_COLOR, ShopItem } from "@/game/data";
import { isImageEmoji } from "@/game/customItems";
import { SmartImage } from "@/components/SmartImage";
import { ChalkBagLoader } from "@/components/ChalkBagLoader";
import { GameButton } from "@/components/ui/game-button";
import { cn } from "@/lib/utils";
import { Check, Trash2 } from "lucide-react";

/**
 * Super-compact inventory tile with the same hover/tap preview pattern as the
 * Shop: full rarity-glow card on desktop hover (fixed, clamped within the
 * viewport), edge-to-edge image card on mobile tap. The preview's primary
 * action calls `onClick`, which the parent uses to open the slot picker.
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
  const tileRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

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

  const bonusRows: { label: string; value: string; cls: string }[] = [];
  if (chalkPct > 0) bonusRows.push({ label: "Chalk Bonus", value: `+${chalkPct}%`, cls: "text-chalk-glow" });
  if (discountPct > 0) bonusRows.push({ label: "Shop Discount", value: `−${discountPct}%`, cls: "text-[hsl(var(--btn-orange))]" });
  if (critPct > 0) bonusRows.push({ label: "Critical Chance", value: `${critPct}%`, cls: "text-[hsl(var(--epic))]" });
  if (bossPct > 0) bonusRows.push({ label: "Boss Bonus", value: `+${bossPct}%`, cls: "text-legendary" });

  const rarityHsl: Record<string, string> = {
    common: "hsl(0 0% 100% / 0.85)",
    uncommon: "hsl(var(--uncommon))",
    rare: "hsl(var(--rare))",
    epic: "hsl(var(--epic))",
    legendary: "hsl(var(--legendary))",
  };
  const rarityBorder: Record<string, string> = {
    common: "border-white/80",
    uncommon: "border-uncommon",
    rare: "border-rare",
    epic: "border-epic",
    legendary: "border-legendary",
  };
  const glowColor = rarityHsl[item.rarity] ?? rarityHsl.common;

  const IMG = 200, DETAILS_W = 244;
  const TOTAL = IMG + DETAILS_W;
  const CARD_H = IMG;

  function handleEnter() {
    const r = tileRef.current?.getBoundingClientRect();
    if (!r) return;
    const tileCx = r.left + r.width / 2;
    const tileCy = r.top + r.height / 2;
    const desiredLeft = tileCx - IMG / 2;
    const desiredTop = tileCy - CARD_H / 2;
    const left = Math.max(12, Math.min(desiredLeft, window.innerWidth - TOTAL - 12));
    const top = Math.max(12, Math.min(desiredTop, window.innerHeight - CARD_H - 12));
    setPos({ left, top });
  }

  function handleTileClick() {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
      setMobileOpen(true);
    } else {
      onClick?.();
    }
  }

  const renderImage = () => {
    if (isImageEmoji(item.emoji)) {
      return <SmartImage src={item.emoji} alt={item.name} loaderSize={40} wrapperClassName="h-full w-full" className="h-full w-full object-cover" />;
    }
    if (item.emoji) {
      return <div className="h-full w-full flex items-center justify-center text-6xl">{item.emoji}</div>;
    }
    return <div className="h-full w-full flex items-center justify-center"><ChalkBagLoader size={36} /></div>;
  };

  const stateBadge = primed
    ? <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded bg-chalk-glow text-background shrink-0">Primed</span>
    : equipped
    ? <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded bg-foreground text-background shrink-0">Equipped</span>
    : null;

  const DetailsCol = ({ compact, withAction }: { compact?: boolean; withAction?: boolean }) => (
    <div className={cn("flex flex-col min-w-0 flex-1", compact ? "p-2.5 gap-1.5" : "")} style={!compact ? { width: DETAILS_W, height: IMG } : undefined}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className={cn("font-bold leading-snug break-words", compact ? "text-base" : "text-xl")}>{item.name}</div>
          <div className={cn("uppercase tracking-wider inline-block mt-1 px-2 py-0.5 rounded border", compact ? "text-[10px]" : "text-xs", RARITY_COLOR[item.rarity])}>
            {item.rarity}
          </div>
        </div>
        {stateBadge}
      </div>

      {bonusRows.length > 0 && (
        <ul className={cn("space-y-1", compact ? "mt-0.5" : "mt-2")}>
          {bonusRows.map((b, i) => (
            <li key={i} className={cn("flex items-center justify-between gap-3", compact ? "text-xs" : "text-base")}>
              <span className="text-muted-foreground">{b.label}</span>
              <span className={cn("font-extrabold tabular-nums", b.cls)}>{b.value}</span>
            </li>
          ))}
        </ul>
      )}

      {item.desc && (
        <p className={cn("text-muted-foreground leading-relaxed flex-1 overflow-hidden", compact ? "mt-0.5 text-xs" : "mt-2 text-sm")}>
          {item.desc}
        </p>
      )}

      {item.category && (
        <div className={cn("text-[11px] uppercase tracking-wider text-muted-foreground/80", compact ? "mt-0.5" : "mt-1.5")}>
          {item.category}
        </div>
      )}

      {withAction && (
        <div className="mt-1.5 flex items-center justify-end gap-2">
          {onRemove && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setMobileOpen(false); onRemove(); }}
              aria-label="Remove from inventory"
              className="h-9 w-9 grid place-items-center rounded-md border border-destructive/60 text-destructive bg-background/70 hover:bg-destructive hover:text-destructive-foreground transition"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <GameButton variant="primary" size="sm" onClick={() => { setMobileOpen(false); onClick?.(); }} className="px-6">
            {equipped ? "Manage" : "Equip"}
          </GameButton>
        </div>
      )}
    </div>
  );

  return (
    <div className="group relative" onMouseEnter={handleEnter}>
      {/* Page-wide dark backdrop while hovered (desktop) */}
      <div className="hidden md:block pointer-events-none fixed inset-0 z-40 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

      {/* Compact tile */}
      <div
        ref={tileRef}
        onClick={handleTileClick}
        title={item.name}
        aria-label={item.name}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleTileClick(); } }}
        className={cn(
          "relative aspect-square w-full overflow-hidden rounded-md cursor-pointer",
          "border-4 transition-opacity duration-200 md:group-hover:opacity-0",
          "shadow-[0_6px_14px_-4px_rgba(0,0,0,0.55)]",
          rarityBorder[item.rarity],
        )}
      >
        {isImageEmoji(item.emoji) ? (
          <SmartImage src={item.emoji} alt={item.name} loaderSize={24} wrapperClassName="h-full w-full" className="h-full w-full object-cover" />
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
              <span key={i} className={cn("text-[9px] leading-none font-bold tabular-nums px-1 py-0.5 rounded border whitespace-nowrap shadow-sm", b.cls)}>
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

      {/* Desktop hover preview — fixed, clamped, interactive */}
      <div
        className={cn(
          "hidden md:block fixed z-50",
          "opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-200",
        )}
        style={{
          left: pos?.left ?? -9999,
          top: pos?.top ?? -9999,
          width: TOTAL,
          ["--glow-color" as string]: glowColor,
        }}
      >
        <div
          className={cn("rounded-xl border-4 overflow-hidden bg-[hsl(var(--panel-fill))] flex items-stretch animate-rarity-glow", rarityBorder[item.rarity])}
        >
          <div className="relative shrink-0 self-stretch bg-black/40" style={{ width: IMG, height: IMG }}>
            {renderImage()}
          </div>
          <DetailsCol compact withAction />
        </div>
      </div>

      {/* Mobile tap preview — edge-to-edge image, horizontal */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 grid place-items-center p-3">
          <div className="absolute inset-0 bg-black/75 animate-in fade-in duration-150" onClick={() => setMobileOpen(false)} />
          <div
            className={cn(
              "relative w-full max-w-[420px] rounded-xl border-4 overflow-hidden bg-[hsl(var(--panel-fill))] animate-rarity-glow flex items-stretch",
              rarityBorder[item.rarity],
            )}
            style={{ ["--glow-color" as string]: glowColor }}
          >
            <div className="relative w-36 shrink-0 bg-black/40 self-stretch">{renderImage()}</div>
            <DetailsCol compact withAction />
          </div>
        </div>
      )}
    </div>
  );
}
