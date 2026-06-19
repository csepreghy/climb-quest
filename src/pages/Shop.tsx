import { useMemo, useRef, useState } from "react";
import { ShopItem, RARITY_COLOR, ItemGroup } from "@/game/data";
import { useAllItems, useCatalogLoaded, isImageEmoji } from "@/game/customItems";
import { buyItem, useGame, effectivePrice } from "@/game/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Lock, Check } from "lucide-react";

import { GameButton } from "@/components/ui/game-button";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import chalkBagImg from "@/assets/chalk-bag.png";
import { SmartImage } from "@/components/SmartImage";
import { ChalkBagLoader } from "@/components/ChalkBagLoader";
import { ItemCard } from "@/components/ItemCard";
import { BuddyCard } from "@/components/BuddyCard";

type GroupKey = ItemGroup | "all";
const GROUPS: { key: GroupKey; label: string; categories: string[] }[] = [
  { key: "all",    label: "All",       categories: [] },
  { key: "outfit", label: "Outfit",    categories: ["All", "Top", "Pants", "Shoes", "Hat", "Hand"] },
  { key: "gear",   label: "Gear",      categories: ["All", "Brushes", "Chalk", "Study"] },
  { key: "power",  label: "Power-ups", categories: [] },
  { key: "buddy",  label: "Climbing Buddies", categories: [] },
];

export default function Shop() {
  const s = useGame();
  const all = useAllItems();
  const loaded = useCatalogLoaded();
  const [group, setGroup] = useState<GroupKey>("all");
  const [cat, setCat] = useState<string>("All");
  const [detail, setDetail] = useState<ShopItem | null>(null);

  const activeGroup = GROUPS.find(g => g.key === group)!;
  const items = useMemo(() => {
    const inGroup = all.filter(i =>
      (group === "all" || i.group === group) &&
      i.price > 0 &&
      (!i.gender || i.gender === "unisex" || i.gender === s.gender)
    );
    const filtered = activeGroup.categories.length === 0 || cat === "All"
      ? inGroup
      : inGroup.filter(i => i.category === cat);
    const rarityOrder: Record<string, number> = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
    return [...filtered].sort((a, b) =>
      (rarityOrder[a.rarity] ?? 99) - (rarityOrder[b.rarity] ?? 99) || a.price - b.price
    );
  }, [group, cat, all, activeGroup, s.gender]);

  return (
    <div className="space-y-5 animate-float-up">
      <div className="flex flex-wrap gap-1.5">
        {GROUPS.map(g => (
          <button key={g.key} onClick={() => { setGroup(g.key); setCat("All"); }}
            className={cn("text-sm px-4 py-2 rounded-md border-2 font-bold transition-colors",
              group === g.key
                ? "bg-secondary text-foreground border-[hsl(var(--panel-frame))]"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50")}>
            {g.label}
          </button>
        ))}
      </div>

      {activeGroup.categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {activeGroup.categories.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={cn("text-xs px-3 py-1.5 rounded-md border transition-colors",
                cat === c ? "bg-secondary text-foreground border-border" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50")}>
              {c}
            </button>
          ))}
        </div>
      )}

      {!loaded && all.length === 0 ? (
        <div className="flex justify-center py-16">
          <ChalkBagLoader size={96} label="Loading shop…" />
        </div>
      ) : (
        <div className="grid gap-2 grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8">
          {items.map(item => (
            <ShopTile
              key={item.id}
              item={item}
              owned={s.owned.includes(item.id)}
              chalk={s.chalk}
              level={s.level}
              state={s}
              ignoreLevelReq={!!s.ignoreLevelReq}
              onClick={() => setDetail(item)}
            />
          ))}
        </div>
      )}

      <ShopDetailDialog
        item={detail}
        onClose={() => setDetail(null)}
        owned={detail ? s.owned.includes(detail.id) : false}
        chalk={s.chalk}
        level={s.level}
        state={s}
        ignoreLevelReq={!!s.ignoreLevelReq}
      />
    </div>
  );
}

function ShopTile({
  item, owned, chalk, level, state, ignoreLevelReq, onClick,
}: {
  item: ShopItem; owned: boolean; chalk: number; level: number;
  state: ReturnType<typeof useGame>; ignoreLevelReq: boolean; onClick: () => void;
}) {
  const locked = !ignoreLevelReq && !!(item.levelReq && level < item.levelReq);
  const price = effectivePrice(state, item.price);
  const canAfford = chalk >= price;
  const isConsumable = !!item.consumableBonus;
  const ownAlready = owned && !isConsumable;



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

  // Flip preview to the left when the tile sits near the right viewport edge.
  const tileRef = useRef<HTMLDivElement | null>(null);
  const [flipped, setFlipped] = useState(false);

  // Layout constants for the hover preview.
  const IMG = 256;          // doubled image (w-64 / h-64)
  const GAP = 8;            // space between image and details
  const DETAILS_W = 288;    // w-72
  const TOTAL = IMG + GAP + DETAILS_W; // 552

  function handleEnter() {
    const r = tileRef.current?.getBoundingClientRect();
    if (!r) return;
    const tileCenter = r.left + r.width / 2;
    // If unflipped, preview extends to tileCenter + (TOTAL - IMG/2). Flip if it would overflow.
    setFlipped(tileCenter + (TOTAL - IMG / 2) > window.innerWidth - 12);
  }

  // Image-center always lands on the tile center.
  // Unflipped (image left):  shift container left by IMG/2.
  // Flipped   (image right): shift container left by (TOTAL - IMG/2).
  const shiftX = flipped ? -(TOTAL - IMG / 2) : -(IMG / 2);

  const renderImage = (sizeCls: string, padCls = "") => {
    if (isImageEmoji(item.emoji)) {
      return <SmartImage src={item.emoji} alt={item.name} loaderSize={40} wrapperClassName={cn(sizeCls)} className={cn("h-full w-full object-cover", padCls)} />;
    }
    if (item.emoji) {
      return <div className={cn(sizeCls, "flex items-center justify-center text-6xl")}>{item.emoji}</div>;
    }
    return <div className={cn(sizeCls, "flex items-center justify-center")}><ChalkBagLoader size={36} /></div>;
  };

  return (
    <div className="group relative" onMouseEnter={handleEnter}>
      {/* Fixed page-wide dark backdrop while hovered (desktop only) */}
      <div className="hidden md:block pointer-events-none fixed inset-0 z-40 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

      {/* Compact tile */}
      <div
        ref={tileRef}
        onClick={onClick}
        title={item.name}
        aria-label={item.name}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
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

        {!locked && (
          <div className="absolute bottom-0 left-0 right-0 flex items-center gap-1 px-1.5 py-1 bg-gradient-to-t from-black/80 via-black/50 to-transparent pointer-events-none">
            <img src={chalkBagImg} alt="" className="h-3.5 w-3.5 object-contain drop-shadow" />
            <span className={cn(
              "text-[12px] leading-none font-extrabold tabular-nums text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]",
              !canAfford && !ownAlready && "text-destructive",
            )}>
              {price.toLocaleString()}
            </span>
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

        {ownAlready && (
          <div className="absolute top-1 left-1 h-5 w-5 grid place-items-center rounded-full border bg-foreground text-background border-foreground shadow" title="Owned">
            <Check className="h-3 w-3" strokeWidth={3} />
          </div>
        )}

        {locked && (
          <div className="absolute inset-0 bg-background/75 grid place-items-center text-muted-foreground">
            <div className="flex flex-col items-center gap-0.5">
              <Lock className="h-4 w-4" />
              <span className="text-[9px] font-bold">Lv {item.levelReq}</span>
            </div>
          </div>
        )}
      </div>

      {/* Expanded hover preview (desktop only): image anchored on tile, details panel docked beside it */}
      <div
        className={cn(
          "hidden md:flex pointer-events-none absolute left-1/2 top-1/2 z-50",
          "opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100",
          "transition-all duration-200 items-stretch",
          flipped ? "flex-row" : "flex-row",
        )}
        style={{
          transform: `translate(${shiftX}px, -50%)`,
          gap: `${GAP}px`,
          width: `${TOTAL}px`,
          ["--glow-color" as string]: glowColor,
        }}
      >
        {/* Image block (left when unflipped, right when flipped) */}
        <div
          className={cn(
            "relative overflow-hidden rounded-lg border-4 animate-rarity-glow shrink-0",
            rarityBorder[item.rarity],
            flipped ? "order-2" : "order-1",
          )}
          style={{ width: IMG, height: IMG }}
        >
          {renderImage("h-full w-full")}

          {badges.length > 0 && (
            <div className="absolute top-2 right-2 flex flex-col items-end gap-1 max-w-[80%]">
              {badges.map((b, i) => (
                <span key={i} className={cn("text-[11px] leading-none font-bold tabular-nums px-1.5 py-1 rounded border whitespace-nowrap shadow-sm", b.cls)}>
                  {b.text}
                </span>
              ))}
            </div>
          )}

          {!locked && (
            <div className="absolute bottom-0 left-0 right-0 flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-t from-black/85 via-black/55 to-transparent">
              <img src={chalkBagImg} alt="" className="h-5 w-5 object-contain drop-shadow" />
              <span className={cn(
                "text-[16px] leading-none font-extrabold tabular-nums text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]",
                !canAfford && !ownAlready && "text-destructive",
              )}>
                {price.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Details panel */}
        <div
          className={cn(
            "rounded-lg border-4 bg-[hsl(var(--panel-fill))] p-4 flex flex-col gap-3 animate-rarity-glow",
            rarityBorder[item.rarity],
            flipped ? "order-1" : "order-2",
          )}
          style={{ width: DETAILS_W, height: IMG }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-base font-bold leading-snug break-words">{item.name}</div>
              <div className={cn("text-[11px] uppercase tracking-wider inline-block mt-1.5 px-2 py-0.5 rounded border", RARITY_COLOR[item.rarity])}>
                {item.rarity}
              </div>
            </div>
            {ownAlready && (
              <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded bg-foreground text-background shrink-0">Owned</span>
            )}
            {locked && (
              <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded bg-muted text-muted-foreground shrink-0 inline-flex items-center gap-1">
                <Lock className="h-3 w-3" /> Lv {item.levelReq}
              </span>
            )}
          </div>
          {item.desc && (
            <p className="text-sm text-muted-foreground leading-relaxed flex-1 overflow-hidden">{item.desc}</p>
          )}
          {item.category && (
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground/80">{item.category}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function ShopDetailDialog({
  item, onClose, owned, chalk, level, state, ignoreLevelReq,
}: {
  item: ShopItem | null; onClose: () => void; owned: boolean; chalk: number; level: number;
  state: ReturnType<typeof useGame>; ignoreLevelReq: boolean;
}) {
  if (!item) return null;
  const locked = !ignoreLevelReq && !!(item.levelReq && level < item.levelReq);
  const price = effectivePrice(state, item.price);
  const canAfford = chalk >= price;
  const isConsumable = !!item.consumableBonus;
  const isBuddy = item.group === "buddy";
  const ownAlready = owned && !isConsumable && !isBuddy ? true : (owned && isBuddy);

  function buy() {
    const r = buyItem(item!.id);
    if (!r.ok) { toast.error(r.reason ?? "Cannot buy"); return; }
    if (isBuddy) {
      toast.success(`Recruited ${item!.name}`, { description: "Equip your buddy from the Inventory." });
    } else {
      toast.success(`Looted ${item!.name}`, { description: isConsumable ? "Equip it to use on your next log." : "Equip it from your Inventory." });
    }
    onClose();
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="truncate">{item.name}</span>
            <span className={cn("text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0", RARITY_COLOR[item.rarity])}>
              {item.rarity}
            </span>
          </DialogTitle>
        </DialogHeader>
        <div className="max-w-sm mx-auto w-full">
          {isBuddy ? <BuddyCard item={item} /> : <ItemCard item={item} />}
        </div>
        <DialogFooter className="gap-2 sm:gap-2 items-center sm:justify-between flex-wrap">
          <span className="font-bold tabular-nums inline-flex items-center gap-1.5">
            <img src={chalkBagImg} alt="Chalk" className="h-5 w-5 object-contain" />
            {price.toLocaleString()}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose} className="bg-secondary hover:bg-muted-foreground/20 text-foreground">Close</Button>
            {ownAlready ? (
              <GameButton variant="ghost" disabled><Check className="h-4 w-4" /> {isBuddy ? "Recruited" : "Owned"}</GameButton>
            ) : locked ? (
              <GameButton variant="ghost" disabled><Lock className="h-4 w-4" /> Lv {item.levelReq}</GameButton>
            ) : (
              <GameButton variant={canAfford ? "primary" : "secondary"} disabled={!canAfford} onClick={buy}>
                {canAfford ? (isBuddy ? "Recruit" : "Buy") : "Not enough Chalk"}
              </GameButton>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
