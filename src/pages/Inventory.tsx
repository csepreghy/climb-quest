import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GameCard } from "@/components/ui/game-card";
import { GameButton } from "@/components/ui/game-button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RARITY_COLOR, RARITY_BORDER, Slot, ItemGroup, Rarity, ShopItem } from "@/game/data";
import { equipItem, unequipSlot, useGame } from "@/game/store";
import { getItem, useCustomItems, isImageEmoji } from "@/game/customItems";
import { ClimberAvatar } from "@/components/ClimberAvatar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";

const SLOT_LABEL: Record<Slot, string> = {
  outfit: "Top",
  bottoms: "Bottom",
  shoes: "Shoes",
  hat: "Hat",
  hand: "Hand",
  chalk: "Chalk",
  accessory: "Brush",
  aura: "Aura",
  title: "Title",
};

const GROUP_LABEL: Record<ItemGroup, string> = {
  outfit: "Outfit",
  gear: "Gear",
  power: "Power-ups",
};

const GROUP_SLOTS: Record<ItemGroup, Slot[]> = {
  outfit: ["outfit", "bottoms", "shoes", "hat", "hand"],
  gear: ["chalk", "accessory"],
  power: ["aura", "title"],
};

function ItemCard({
  item,
  showAction,
  actionLabel,
  onAction,
  onClick,
  primed,
  highlight,
}: {
  item: ShopItem;
  showAction?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  onClick?: () => void;
  primed?: boolean;
  highlight?: boolean;
}) {
  const tone = item.rarity === "legendary" ? "legendary" : item.rarity === "rare" ? "rare" : "default";
  const bonusPct = item.bonus?.mult ? Math.round(item.bonus.mult * 100) : 0;
  const consumablePct = item.consumableBonus ? Math.round(item.consumableBonus * 100) : 0;
  const showPct = bonusPct || consumablePct;
  return (
    <GameCard
      tone={tone as "default"}
      shimmer={item.rarity === "legendary"}
      interactive={!!onClick}
      className={cn("p-4 flex flex-col gap-3 relative", onClick && "cursor-pointer", highlight && "ring-2 ring-[hsl(var(--btn-orange))]/60")}
      onClick={onClick}
    >
      {showPct > 0 && (
        <div className="absolute top-2 right-2 z-10 text-[11px] font-bold tabular-nums px-2 py-0.5 rounded-md bg-chalk-glow/15 text-chalk-glow border border-chalk-glow/40">
          +{showPct}%
        </div>
      )}
      <div className="flex items-start gap-3">
        {isImageEmoji(item.emoji)
          ? <img src={item.emoji} alt={item.name} className={cn("h-20 w-20 object-contain rounded-lg bg-background/40 p-1 shrink-0", RARITY_BORDER[item.rarity])} />
          : <div className={cn("text-5xl h-20 w-20 flex items-center justify-center rounded-lg bg-background/40 shrink-0", RARITY_BORDER[item.rarity])}>{item.emoji}</div>}
        <div className="min-w-0 flex-1 pr-12">
          <div className="text-sm font-medium leading-snug">{item.name}</div>
          <div className={cn("text-[10px] uppercase tracking-wider inline-block mt-1 px-1.5 py-0.5 rounded border", RARITY_COLOR[item.rarity])}>
            {item.rarity}
          </div>
          {primed && <div className="mt-1 text-[10px] uppercase tracking-wider text-chalk-glow">Primed</div>}
        </div>
      </div>
      {item.desc && <p className="text-xs text-muted-foreground flex-1 leading-relaxed">{item.desc}</p>}
      {showAction && (
        <div className="flex items-center justify-end pt-2 border-t border-border/50">
          <GameButton size="sm" variant="primary" onClick={(e) => { e.stopPropagation(); onAction?.(); }}>
            {actionLabel ?? "Equip"}
          </GameButton>
        </div>
      )}
    </GameCard>
  );
}

function EmptySlotCard({ slot }: { slot: Slot }) {
  return (
    <GameCard className="p-4 flex flex-col gap-3 relative opacity-60 h-full">
      <div className="flex items-start gap-3">
        <div className="h-20 w-20 flex items-center justify-center rounded-lg bg-background/40 shrink-0 border border-dashed border-border text-2xl">∅</div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium leading-snug text-muted-foreground">Empty</div>
          <div className="text-[10px] uppercase tracking-wider mt-1 text-muted-foreground">{SLOT_LABEL[slot]}</div>
        </div>
      </div>
    </GameCard>
  );
}

export default function Inventory() {
  const s = useGame();
  useCustomItems();
  const owned = s.owned.map(id => getItem(id)).filter(Boolean) as ShopItem[];
  const totalBonusByActivity = gearBonusSummary(s.equipped);

  const [compareItem, setCompareItem] = useState<ShopItem | null>(null);
  const equippedItem = compareItem
    ? (compareItem.consumableBonus
        ? (s.pendingConsumable ? getItem(s.pendingConsumable) ?? null : null)
        : (s.equipped[compareItem.slot] ? getItem(s.equipped[compareItem.slot]!) ?? null : null))
    : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[320px,1fr] animate-float-up">
      <div className="space-y-4">
        <Card className="gradient-card p-5 text-center">
          <ClimberAvatar level={s.level} gender={s.gender} equipped={s.equipped} size="xl" glow />
          <div className="mt-4 text-xs text-muted-foreground capitalize">{s.gender} preset</div>
        </Card>

        <Card className="gradient-card p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Active bonuses</div>
          {totalBonusByActivity.length === 0 ? (
            <div className="text-xs text-muted-foreground italic">No equipped bonuses yet. Hit the shop.</div>
          ) : (
            <ul className="space-y-1 text-xs">
              {totalBonusByActivity.map(b => (
                <li key={b.label} className="flex justify-between">
                  <span>{b.label}</span><span className="text-chalk-glow">+{Math.round(b.mult * 100)}%</span>
                </li>
              ))}
            </ul>
          )}
          {s.pendingConsumable && (
            <div className="mt-3 text-xs px-2 py-1.5 rounded-md bg-chalk-glow/10 border border-chalk-glow/40">
              ⚡ Next log boosted by {getItem(s.pendingConsumable)?.name}
            </div>
          )}
        </Card>
      </div>

      <div className="space-y-8">
        {/* EQUIPPED */}
        <section className="space-y-4">
          <div className="menu-label">Equipped</div>
          {(["outfit", "gear", "power"] as ItemGroup[]).map(group => {
            const slots = GROUP_SLOTS[group];
            return (
              <div key={group} className="space-y-2">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground pl-1">{GROUP_LABEL[group]}</div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {slots.map(slot => {
                    const id = s.equipped[slot];
                    const it = id ? getItem(id) : null;
                    if (!it) return (
                      <div key={slot} className="flex flex-col">
                        <div className="flex-1"><EmptySlotCard slot={slot} /></div>
                        <div className="h-7 mt-1.5" aria-hidden />
                      </div>
                    );
                    return (
                      <div key={slot} className="flex flex-col">
                        <div className="flex-1"><ItemCard item={it} /></div>
                        <div className="flex justify-end mt-1.5">
                          <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => unequipSlot(slot)}>Unequip</Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>

        {/* OWNED */}
        <section className="space-y-3">
          <div className="menu-label">Owned ({owned.length})</div>
          {owned.length === 0 ? (
            <Card className="gradient-card p-4">
              <p className="text-sm text-muted-foreground italic">No items yet. Visit the shop to gear up.</p>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {owned.map(it => {
                const isEquipped = !it.consumableBonus && s.equipped[it.slot] === it.id;
                const isPrimed = !!it.consumableBonus && s.pendingConsumable === it.id;
                return (
                  <ItemCard
                    key={it.id}
                    item={it}
                    primed={isPrimed}
                    highlight={isEquipped}
                    onClick={() => setCompareItem(it)}
                  />
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* COMPARE MODAL */}
      <Dialog open={!!compareItem} onOpenChange={(o) => { if (!o) setCompareItem(null); }}>
        <DialogContent className="max-w-3xl">
          {compareItem && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {compareItem.consumableBonus
                    ? `Prime ${compareItem.name}?`
                    : `Equip ${compareItem.name}?`}
                </DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-4 items-center">
                <div className="space-y-2">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {compareItem.consumableBonus ? "Currently primed" : `Equipped · ${SLOT_LABEL[compareItem.slot]}`}
                  </div>
                  {equippedItem
                    ? <ItemCard item={equippedItem} />
                    : <EmptySlotCard slot={compareItem.slot} />}
                </div>

                <div className="hidden md:flex justify-center">
                  <ArrowRight className="h-6 w-6 text-muted-foreground" />
                </div>

                <div className="space-y-2">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">New</div>
                  <ItemCard item={compareItem} />
                </div>
              </div>

              <BonusDiff current={equippedItem} next={compareItem} />

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setCompareItem(null)} className="bg-secondary hover:bg-muted-foreground/20 text-foreground">Close</Button>
                  const alreadyOn = compareItem.consumableBonus
                    ? s.pendingConsumable === compareItem.id
                    : s.equipped[compareItem.slot] === compareItem.id;
                  return (
                    <GameButton
                      variant="primary"
                      disabled={alreadyOn}
                      onClick={() => {
                        equipItem(compareItem.id);
                        toast.success(compareItem.consumableBonus ? `Primed ${compareItem.name}` : `Equipped ${compareItem.name}`);
                        setCompareItem(null);
                      }}
                    >
                      {alreadyOn
                        ? (compareItem.consumableBonus ? "Already primed" : "Already equipped")
                        : (compareItem.consumableBonus ? "Prime" : "Equip")}
                    </GameButton>
                  );
                })()}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BonusDiff({ current, next }: { current: ShopItem | null; next: ShopItem }) {
  const cur = (current?.bonus?.mult ?? current?.consumableBonus ?? 0) * 100;
  const nxt = (next.bonus?.mult ?? next.consumableBonus ?? 0) * 100;
  const delta = nxt - cur;
  if (delta === 0 && cur === 0) return null;
  const sign = delta > 0 ? "+" : "";
  const color = delta > 0 ? "text-chalk-glow" : delta < 0 ? "text-destructive" : "text-muted-foreground";
  return (
    <div className="text-xs text-center text-muted-foreground border-t border-border/50 pt-3 tabular-nums">
      Bonus: {Math.round(cur)}% → {Math.round(nxt)}%
      {delta !== 0 && <span className={cn("ml-2 font-bold", color)}>({sign}{Math.round(delta)}%)</span>}
    </div>
  );
}

function gearBonusSummary(eq: ReturnType<typeof useGame>["equipped"]) {
  const out: { label: string; mult: number }[] = [];
  for (const id of Object.values(eq)) {
    if (!id) continue;
    const it = getItem(id); if (!it?.bonus || it.bonus.mult <= 0) continue;
    let label = it.name + " — ";
    if (it.bonus.appliesTo === "all") label += "all logs";
    else if (it.bonus.appliesTo) label += it.bonus.appliesTo.join(", ");
    if (it.bonus.styleMatch) label += ` · styles: ${it.bonus.styleMatch.join(", ")}`;
    out.push({ label, mult: it.bonus.mult });
  }
  return out;
}
