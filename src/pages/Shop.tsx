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
        <h1 className="font-display text-2xl font-bold">Chalk Shop</h1>
        <p className="text-sm text-muted-foreground">Spend Chalk on silly gear. Bonuses apply to future logged sessions.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCat(c)}
            className={cn("text-xs px-3 py-1.5 rounded-full border transition",
              cat === c ? "bg-accent text-accent-foreground border-accent shadow-glow" : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground")}>
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
    toast.success(`Looted ${item.name}!`, { description: isConsumable ? "Equip it to use on your next log." : "Equip it from your Inventory." });
  }

  return (
    <Card className={cn("gradient-card p-4 border flex flex-col gap-3 relative overflow-hidden",
      item.rarity === "legendary" && "border-legendary/40")}>
      {item.rarity === "legendary" && <div className="absolute -top-10 -right-10 h-32 w-32 bg-legendary/20 blur-3xl rounded-full pointer-events-none" />}
      <div className="flex items-start gap-3">
        <div className="text-4xl">{item.emoji}</div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold truncate">{item.name}</div>
          <div className={cn("text-[10px] uppercase tracking-wider font-bold inline-block px-1.5 py-0.5 rounded border mt-0.5", RARITY_COLOR[item.rarity])}>
            {item.rarity}
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground flex-1">{item.desc}</p>
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40">
        <div className="text-sm">
          {item.price === 0 ? <span className="text-muted-foreground">Starter</span> : <span className="font-bold gradient-chalk-text">🧂 {item.price}</span>}
        </div>
        {ownAlready ? (
          <Button size="sm" variant="secondary" disabled className="gap-1"><Check className="h-3 w-3" /> Owned</Button>
        ) : locked ? (
          <Button size="sm" variant="outline" disabled className="gap-1"><Lock className="h-3 w-3" /> Lv {item.levelReq}</Button>
        ) : (
          <Button size="sm" disabled={!canAfford || item.price === 0} onClick={buy}>
            {item.price === 0 ? "Free" : canAfford ? "Buy" : "Need Chalk"}
          </Button>
        )}
      </div>
    </Card>
  );
}
