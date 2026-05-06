import { useMemo, useState } from "react";
import { ShopItem, RARITY_BORDER, ItemGroup } from "@/game/data";
import { useAllItems, isImageEmoji } from "@/game/customItems";
import { buyItem, useGame } from "@/game/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import chalkBagImg from "@/assets/chalk-bag.png";

type GroupKey = ItemGroup | "all";

const GROUPS: { key: GroupKey; label: string; categories: string[] }[] = [
  { key: "all",    label: "All",        categories: ["All"] },
  { key: "outfit", label: "Outfit",     categories: ["All", "Top", "Bottom", "Shoes", "Hat", "Hand"] },
  { key: "gear",   label: "Gear",       categories: ["All", "Brushes", "Chalk"] },
  { key: "power",  label: "Power-ups",  categories: ["All", "Accessories", "Auras", "Titles", "Consumables"] },
];

export default function Shop() {
  const s = useGame();
  const all = useAllItems();
  const [group, setGroup] = useState<GroupKey>("all");
  const [cat, setCat] = useState<string>("All");

  const activeGroup = GROUPS.find(g => g.key === group)!;
  const items = useMemo(() => {
    const inGroup = group === "all" ? all : all.filter(i => i.group === group);
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

      {activeGroup.categories.length > 1 && (
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

      <Card className="gradient-card p-4">
        <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 lg:grid-cols-6">
          {items.map(item => (
            <ShopTile
              key={item.id}
              item={item}
              owned={s.owned.includes(item.id)}
              chalk={s.chalk}
              level={s.level}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}

function ShopTile({ item, owned, chalk, level }: { item: ShopItem; owned: boolean; chalk: number; level: number }) {
  const locked = !!(item.levelReq && level < item.levelReq);
  const isConsumable = !!item.consumableBonus;
  const ownAlready = owned && !isConsumable;
  const canAfford = chalk >= item.price;
  const disabled = ownAlready || locked || !canAfford;

  function buy() {
    if (ownAlready) { toast.info("Already owned"); return; }
    if (locked) { toast.error(`Requires Level ${item.levelReq}`); return; }
    const r = buyItem(item.id);
    if (!r.ok) { toast.error(r.reason ?? "Cannot buy"); return; }
    toast.success(`Looted ${item.name}`, { description: isConsumable ? "Equip it on your next log." : "Equip it from your Inventory." });
  }

  const bonusPct = item.bonus?.mult ? Math.round(item.bonus.mult * 100) : 0;
  const titleParts = [
    item.name,
    item.desc,
    bonusPct > 0 ? `+${bonusPct}% bonus` : "",
    item.levelReq ? `Requires Lv ${item.levelReq}` : "",
    item.price > 0 ? `${item.price} Chalk` : "Free",
    ownAlready ? "Owned" : "",
  ].filter(Boolean);

  return (
    <button
      title={titleParts.join(" · ")}
      onClick={buy}
      className={cn(
        "relative aspect-square p-2 rounded-lg border flex items-center justify-center transition-colors group",
        ownAlready
          ? "border-[hsl(var(--btn-orange))] ring-2 ring-[hsl(var(--btn-orange))]/40 bg-[hsl(var(--btn-orange))]/5"
          : "border-border bg-secondary/20 hover:bg-secondary/40",
        disabled && !ownAlready && "opacity-60",
      )}
    >
      {bonusPct > 0 && (
        <div className="absolute top-1 right-1 z-10 text-[9px] font-bold tabular-nums px-1.5 py-0.5 rounded bg-chalk-glow/15 text-chalk-glow border border-chalk-glow/40">
          +{bonusPct}%
        </div>
      )}
      {isImageEmoji(item.emoji)
        ? <img src={item.emoji} alt={item.name} className={cn("h-full w-full object-contain rounded bg-background/40 p-1", RARITY_BORDER[item.rarity])} />
        : <span className={cn("inline-flex items-center justify-center rounded leading-none text-5xl h-full w-full bg-background/40", RARITY_BORDER[item.rarity])}>{item.emoji}</span>}
      <div className="absolute bottom-1 left-1 right-1 flex items-center justify-center gap-1 text-[10px] font-bold tabular-nums bg-background/80 rounded px-1 py-0.5">
        {item.price === 0 ? "Free" : <>{item.price}<img src={chalkBagImg} alt="" className="h-3 w-3 object-contain" /></>}
      </div>
    </button>
  );
}
