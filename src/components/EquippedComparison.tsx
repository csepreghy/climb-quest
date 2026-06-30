import { ArrowRight } from "lucide-react";
import { ShopItem } from "@/game/data";
import { useGame } from "@/game/store";
import { useAllItems } from "@/game/customItems";
import { ItemCard } from "@/components/ItemCard";
import { cn } from "@/lib/utils";

function bonuses(it: ShopItem) {
  return {
    chalk: Math.round(((it.bonus?.mult ?? 0) + (it.consumableBonus ?? 0)) * 100),
    crit: Math.round(it.critChancePct ?? 0),
    boss: Math.round(it.bossBonusPct ?? 0),
    board: Math.round(it.boardBonusPct ?? 0),
    discount: it.priceMult && it.priceMult < 1 ? Math.round((1 - it.priceMult) * 100) : 0,
  };
}

export function EquippedComparison({ item, className }: { item: ShopItem; className?: string }) {
  const s = useGame();
  const all = useAllItems();
  const equippedId = s.equipped[item.slot];
  if (!equippedId || equippedId === item.id) return null;
  const equipped = all.find((i) => i.id === equippedId);
  if (!equipped) return null;

  const a = bonuses(equipped);
  const b = bonuses(item);
  const rows = [
    { label: "Chalk Bonus", from: a.chalk, to: b.chalk, cls: "text-chalk-glow" },
    { label: "Critical Chance", from: a.crit, to: b.crit, cls: "text-[hsl(var(--epic))]" },
    { label: "Boss Bonus", from: a.boss, to: b.boss, cls: "text-legendary" },
    { label: "Board Bonus", from: a.board, to: b.board, cls: "text-[hsl(var(--board-bonus))]" },
    { label: "Shop Discount", from: a.discount, to: b.discount, cls: "text-[hsl(var(--shop-discount))]" },
  ].filter((r) => r.from !== 0 || r.to !== 0);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
        Currently equipped
      </div>
      <ItemCard item={equipped} />
      {rows.length > 0 && (
        <div className="rounded-md border border-border/60 bg-background/40 p-2.5 space-y-1.5">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
            Changes if equipped
          </div>
          {rows.map((r) => {
            const diff = r.to - r.from;
            const diffStr = diff === 0 ? "—" : `${diff > 0 ? "+" : ""}${diff}%`;
            const diffCls =
              diff > 0 ? "text-emerald-400" : diff < 0 ? "text-destructive" : "text-muted-foreground";
            return (
              <div key={r.label} className="flex items-center justify-between gap-2 text-xs">
                <span className="text-muted-foreground">{r.label}</span>
                <div className="flex items-center gap-2 tabular-nums font-bold">
                  <span className={r.cls}>{r.from}%</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className={r.cls}>{r.to}%</span>
                  <span className={cn("ml-1 text-[11px] min-w-[36px] text-right", diffCls)}>
                    {diffStr}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold pt-1">
        New item
      </div>
    </div>
  );
}
