import { useMemo, useState } from "react";
import { ShopItem, RARITY_COLOR, RARITY_BORDER, ItemGroup } from "@/game/data";
import { useAllItems, useCatalogLoaded, isImageEmoji } from "@/game/customItems";
import { buyItem, useGame, effectivePrice } from "@/game/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Lock, Check } from "lucide-react";
import { GameCard } from "@/components/ui/game-card";
import { GameButton } from "@/components/ui/game-button";
import chalkBagImg from "@/assets/chalk-bag.png";
import { SmartImage } from "@/components/SmartImage";
import { ChalkBagLoader } from "@/components/ChalkBagLoader";
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(item => item.group === "buddy"
            ? <BuddyShopCard key={item.id} item={item} owned={s.owned.includes(item.id)} chalk={s.chalk} level={s.level} state={s} ignoreLevelReq={!!s.ignoreLevelReq} />
            : <ShopCard key={item.id} item={item} owned={s.owned.includes(item.id)} chalk={s.chalk} level={s.level} state={s} ignoreLevelReq={!!s.ignoreLevelReq} />
          )}
        </div>
      )}
    </div>
  );
}

function ShopCard({ item, owned, chalk, level, state, ignoreLevelReq }: { item: ShopItem; owned: boolean; chalk: number; level: number; state: ReturnType<typeof useGame>; ignoreLevelReq: boolean }) {
  const locked = !ignoreLevelReq && !!(item.levelReq && level < item.levelReq);
  const price = effectivePrice(state, item.price);
  const discounted = price < item.price;
  const canAfford = chalk >= price;
  const isConsumable = !!item.consumableBonus;
  const ownAlready = owned && !isConsumable;

  function buy() {
    const r = buyItem(item.id);
    if (!r.ok) { toast.error(r.reason ?? "Cannot buy"); return; }
    toast.success(`Looted ${item.name}`, { description: isConsumable ? "Equip it to use on your next log." : "Equip it from your Inventory." });
  }

  const tone = item.rarity === "legendary" ? "legendary" : item.rarity === "rare" ? "rare" : "default";

  const bonusPct = item.bonus?.mult ? Math.round(item.bonus.mult * 100) : 0;
  const consumablePct = item.consumableBonus ? Math.round(item.consumableBonus * 100) : 0;
  const chalkPct = bonusPct || consumablePct;
  const discountPct = item.priceMult && item.priceMult < 1 ? Math.round((1 - item.priceMult) * 100) : 0;
  const critPct = item.critChancePct ? Math.round(item.critChancePct) : 0;
  const bossPct = item.bossBonusPct ? Math.round(item.bossBonusPct) : 0;
  const badges: { text: string; cls: string }[] = [];
  if (chalkPct > 0) badges.push({ text: `+${chalkPct}%`, cls: "bg-chalk-glow/15 text-chalk-glow border-chalk-glow/40" });
  if (discountPct > 0) badges.push({ text: `−${discountPct}% shop`, cls: "bg-[hsl(var(--btn-orange))]/15 text-[hsl(var(--btn-orange))] border-[hsl(var(--btn-orange))]/40" });
  if (critPct > 0) badges.push({ text: `${critPct}% crit`, cls: "bg-[hsl(var(--epic))]/15 text-[hsl(var(--epic))] border-[hsl(var(--epic))]/50" });
  if (bossPct > 0) badges.push({ text: `+${bossPct}% boss`, cls: "bg-legendary/15 text-legendary border-legendary/40" });

  return (
    <GameCard tone={tone as "default"} shimmer={item.rarity === "legendary"} className="p-4 flex flex-col gap-3 relative">
      {badges.length > 0 && (
        <div className="absolute top-2 right-2 z-10 flex flex-col items-end gap-0.5">
          {badges.map((b, i) => (
            <div key={i} className={cn("text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-md border whitespace-nowrap", b.cls)}>
              {b.text}
            </div>
          ))}
        </div>
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
        </div>
      </div>
      {item.desc && <p className="text-xs text-muted-foreground flex-1 leading-relaxed">{item.desc}</p>}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
        <div className="text-sm">
          {item.price === 0 ? (
            <span className="text-muted-foreground text-xs">Starter</span>
          ) : (
            <span className="font-medium tabular-nums inline-flex items-center gap-1">
              
              {price}
              <img src={chalkBagImg} alt="Chalk" className="h-4 w-4 object-contain" />
            </span>
          )}
        </div>
        {ownAlready ? (
          <GameButton size="sm" variant="ghost" disabled><Check className="h-3 w-3" /> Owned</GameButton>
        ) : locked ? (
          <GameButton size="sm" variant="ghost" disabled><Lock className="h-3 w-3" /> Lv {item.levelReq}</GameButton>
        ) : (
          <GameButton size="sm" variant={!canAfford || item.price === 0 ? "secondary" : "primary"} disabled={!canAfford || item.price === 0} onClick={buy}>
            {item.price === 0 ? "Free" : canAfford ? "Buy" : "Not enough Chalk"}
          </GameButton>
        )}
      </div>
    </GameCard>
  );
}

function BuddyShopCard({ item, owned, chalk, level, state, ignoreLevelReq }: { item: ShopItem; owned: boolean; chalk: number; level: number; state: ReturnType<typeof useGame>; ignoreLevelReq: boolean }) {
  const locked = !ignoreLevelReq && !!(item.levelReq && level < item.levelReq);
  const price = effectivePrice(state, item.price);
  const canAfford = chalk >= price;
  const ownAlready = owned;

  function buy() {
    const r = buyItem(item.id);
    if (!r.ok) { toast.error(r.reason ?? "Cannot buy"); return; }
    toast.success(`Recruited ${item.name}`, { description: "Equip your buddy from the Inventory." });
  }

  return (
    <BuddyCard
      item={item}
      footer={
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm">
            {item.price === 0 ? (
              <span className="text-muted-foreground text-xs">Starter</span>
            ) : (
              <span className="font-medium tabular-nums inline-flex items-center gap-1">
                {price}
                <img src={chalkBagImg} alt="Chalk" className="h-4 w-4 object-contain" />
              </span>
            )}
          </div>
          {ownAlready ? (
            <GameButton size="sm" variant="ghost" disabled><Check className="h-3 w-3" /> Recruited</GameButton>
          ) : locked ? (
            <GameButton size="sm" variant="ghost" disabled><Lock className="h-3 w-3" /> Lv {item.levelReq}</GameButton>
          ) : (
            <GameButton size="sm" variant={!canAfford || item.price === 0 ? "secondary" : "primary"} disabled={!canAfford || item.price === 0} onClick={buy}>
              {item.price === 0 ? "Free" : canAfford ? "Recruit" : "Not enough Chalk"}
            </GameButton>
          )}
        </div>
      }
    />
  );
}
