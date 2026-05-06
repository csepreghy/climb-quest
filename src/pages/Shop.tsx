import { useMemo, useState } from "react";
import { ShopItem, RARITY_COLOR, RARITY_BORDER, ItemGroup } from "@/game/data";
import { useAllItems, isImageEmoji } from "@/game/customItems";
import { buyItem, useGame } from "@/game/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Lock, Check } from "lucide-react";
import { GameCard } from "@/components/ui/game-card";
import { GameButton } from "@/components/ui/game-button";

const GROUPS: { key: ItemGroup; label: string; categories: string[] }[] = [
  { key: "outfit", label: "Outfit",    categories: ["All", "Top", "Bottom", "Shoes", "Hat", "Hand"] },
  { key: "gear",   label: "Gear",      categories: ["All", "Brushes", "Chalk"] },
  { key: "power",  label: "Power-ups", categories: ["All", "Accessories", "Auras", "Titles", "Consumables"] },
];

export default function Shop() {
  const s = useGame();
  const all = useAllItems();
  const [group, setGroup] = useState<ItemGroup>("outfit");
  const [cat, setCat] = useState<string>("All");

  const activeGroup = GROUPS.find(g => g.key === group)!;
  const items = useMemo(() => {
    const inGroup = all.filter(i => i.group === group);
    return cat === "All" ? inGroup : inGroup.filter(i => i.category === cat);
  }, [group, cat, all]);

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

      <div className="flex flex-wrap gap-1.5">
        {activeGroup.categories.map(c => (
          <button key={c} onClick={() => setCat(c)}
            className={cn("text-xs px-3 py-1.5 rounded-md border transition-colors",
              cat === c ? "bg-secondary text-foreground border-border" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50")}>
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(item => <ShopCard key={item.id} item={item} owned={s.owned.includes(item.id)} chalk={s.chalk} level={s.level} />)}
      </div>
    </div>
  );
}

function ShopCard({ item, owned, chalk, level }: { item: ShopItem; owned: boolean; chalk: number; level: number }) {
  const locked = !!(item.levelReq && level < item.levelReq);
  const canAfford = chalk >= item.price;
  const isConsumable = item.rarity === "consumable";
  const ownAlready = owned && !isConsumable;

  function buy() {
    const r = buyItem(item.id);
    if (!r.ok) { toast.error(r.reason ?? "Cannot buy"); return; }
    toast.success(`Looted ${item.name}`, { description: isConsumable ? "Equip it to use on your next log." : "Equip it from your Inventory." });
  }

  const tone = item.rarity === "legendary" ? "legendary" : item.rarity === "rare" ? "rare" : "default";

  return (
    <GameCard tone={tone as "default"} shimmer={item.rarity === "legendary"} className="p-0 flex flex-row gap-0 overflow-hidden">
      {isImageEmoji(item.emoji)
        ? <img src={item.emoji} alt={item.name} className={cn("h-32 w-32 shrink-0 object-cover bg-background/40", RARITY_BORDER[item.rarity])} />
        : <div className={cn("h-32 w-32 shrink-0 text-6xl flex items-center justify-center bg-background/40", RARITY_BORDER[item.rarity])}>{item.emoji}</div>}
      <div className="flex flex-col gap-2 p-3 flex-1 min-w-0">
        <div className="min-w-0">
          <div className="text-sm font-medium leading-snug truncate">{item.name}</div>
          <div className={cn("text-[10px] uppercase tracking-wider inline-block mt-1 px-1.5 py-0.5 rounded border", RARITY_COLOR[item.rarity])}>
            {item.rarity}
          </div>
        </div>
        {item.desc && <p className="text-xs text-muted-foreground flex-1 leading-relaxed">{item.desc}</p>}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
        <div className="text-sm">
          {item.price === 0 ? <span className="text-muted-foreground text-xs">Starter</span> : <span className="font-medium tabular-nums">{item.price} <span className="text-muted-foreground text-xs">Chalk</span></span>}
        </div>
        {ownAlready ? (
          <GameButton size="sm" variant="ghost" disabled><Check className="h-3 w-3" /> Owned</GameButton>
        ) : locked ? (
          <GameButton size="sm" variant="ghost" disabled><Lock className="h-3 w-3" /> Lv {item.levelReq}</GameButton>
        ) : (
          <GameButton size="sm" variant={item.rarity === "legendary" ? "legendary" : "primary"} disabled={!canAfford || item.price === 0} onClick={buy}>
            {item.price === 0 ? "Free" : canAfford ? "Buy" : "No Chalk"}
          </GameButton>
        )}
      </div>
    </GameCard>
  );
}
