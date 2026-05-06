import { useMemo, useState } from "react";
import { SHOP, ShopItem, RARITY_COLOR } from "@/game/data";
import { buyItem, useGame } from "@/game/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Lock, Check } from "lucide-react";
import { GameCard } from "@/components/ui/game-card";
import { GameButton } from "@/components/ui/game-button";

const CATEGORIES = ["All","Shoes","Chalk","Outfits","Brushes","Accessories","Auras","Titles","Consumables"] as const;

export default function Shop() {
  const s = useGame();
  const [cat, setCat] = useState<typeof CATEGORIES[number]>("All");
  const items = useMemo(() => cat === "All" ? SHOP : SHOP.filter(i => i.category === cat), [cat]);

  return (
    <div className="space-y-5 animate-float-up">
      <div>
        <h1 className="font-display text-2xl font-semibold">Chalk Shop</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Spend Chalk on silly gear. Bonuses apply to future logged sessions.</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map(c => (
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
    <GameCard tone={tone as "default"} shimmer={item.rarity === "legendary"} className="p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="text-3xl">{item.emoji}</div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium leading-snug truncate">{item.name}</div>
          <div className={cn("text-[10px] uppercase tracking-wider inline-block mt-1 px-1.5 py-0.5 rounded border", RARITY_COLOR[item.rarity])}>
            {item.rarity}
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground flex-1 leading-relaxed">{item.desc}</p>
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
