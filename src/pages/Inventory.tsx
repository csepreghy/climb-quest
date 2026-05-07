import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GameCard } from "@/components/ui/game-card";
import { GameButton } from "@/components/ui/game-button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slot, ItemGroup, Rarity, ShopItem, GEAR_SLOTS, gearSlotsUnlocked, LEVELS } from "@/game/data";
import { equipItem, unequipSlot, removeOwnedItem, setGender, useGame } from "@/game/store";
import { getItem, useCustomItems } from "@/game/customItems";
import { ClimberAvatar } from "@/components/ClimberAvatar";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ArrowRight, Lock } from "lucide-react";
import { ItemCard } from "@/components/ItemCard";

const SLOT_LABEL: Record<Slot, string> = {
  outfit: "Top",
  bottoms: "Pants",
  shoes: "Shoes",
  hat: "Hat",
  hand: "Hand",
  chalk: "Chalk",
  accessory: "Brush",
  study: "Study",
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
  gear: GEAR_SLOTS,
  power: ["aura", "title"],
};

function EmptySlotCard({ label }: { label: string }) {
  return (
    <GameCard className="p-4 flex flex-col gap-3 relative opacity-60 h-full">
      <div className="flex items-start gap-3">
        <div className="h-20 w-20 flex items-center justify-center rounded-lg bg-background/40 shrink-0 border border-dashed border-border text-2xl">∅</div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium leading-snug text-muted-foreground">Empty</div>
          <div className="text-[10px] uppercase tracking-wider mt-1 text-muted-foreground">{label}</div>
        </div>
      </div>
    </GameCard>
  );
}

function LockedSlotCard({ unlocksAt }: { unlocksAt: number }) {
  return (
    <GameCard className="p-4 flex flex-col gap-3 relative opacity-50 h-full">
      <div className="flex items-start gap-3">
        <div className="h-20 w-20 flex items-center justify-center rounded-lg bg-background/40 shrink-0 border border-dashed border-border">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium leading-snug text-muted-foreground">Locked</div>
          <div className="text-[10px] uppercase tracking-wider mt-1 text-muted-foreground">Unlocks at Lv {unlocksAt}</div>
        </div>
      </div>
    </GameCard>
  );
}

function gearUnlockLevel(slotIndex: number): number {
  // slot 0: lvl 1, slot 1: lvl 3, slot 2: lvl 5, slot 3: lvl 8
  return [1, 3, 5, 8][slotIndex] ?? 99;
}

export default function Inventory() {
  const s = useGame();
  const { isAdmin } = useAuth();
  useCustomItems();
  const owned = s.owned.map(id => getItem(id)).filter(Boolean) as ShopItem[];
  const totalBonusByActivity = gearBonusSummary(s.equipped);

  const [compareItem, setCompareItem] = useState<ShopItem | null>(null);
  const [slotPicker, setSlotPicker] = useState<ShopItem | null>(null);
  const equippedItem = compareItem
    ? (compareItem.consumableBonus
        ? (s.pendingConsumable ? getItem(s.pendingConsumable) ?? null : null)
        : (s.equipped[compareItem.slot] ? getItem(s.equipped[compareItem.slot]!) ?? null : null))
    : null;
  const slotAlternatives = slotPicker
    ? owned.filter(it => it.slot === slotPicker.slot && it.id !== slotPicker.id)
    : [];

  return (
    <div className="grid gap-6 lg:grid-cols-[320px,1fr] animate-float-up">
      <div className="space-y-4">
        <Card className="gradient-card p-5 text-center">
          <ClimberAvatar level={s.level} gender={s.gender} equipped={s.equipped} size="xl" glow />
          <div className="mt-4 flex gap-2 justify-center">
            {(["male","female"] as const).map(g => (
              <Button
                key={g}
                size="sm"
                variant={s.gender === g ? "default" : "secondary"}
                onClick={() => setGender(g)}
                className="capitalize"
              >
                {g}
              </Button>
            ))}
          </div>
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
            if (group === "gear") {
              const max = gearSlotsUnlocked(s.level);
              // Order equipped gear items first, then empty unlocked slots, then locked slots up to 4 total.
              const equippedGear = GEAR_SLOTS
                .map(sl => ({ slot: sl, id: s.equipped[sl] }))
                .filter(x => !!x.id) as { slot: Slot; id: string }[];
              const emptyCount = Math.max(0, max - equippedGear.length);
              const lockedCount = Math.max(0, 4 - max);
              return (
                <div key={group} className="space-y-2">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground pl-1 flex items-center gap-2">
                    <span>{GROUP_LABEL[group]}</span>
                    <span className="text-muted-foreground/70">· {equippedGear.length}/{max} used</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {equippedGear.map(({ slot, id }) => {
                      const it = getItem(id)!;
                      return (
                        <div key={slot} className="flex flex-col">
                          <div className="flex-1"><ItemCard item={it} onClick={() => setSlotPicker(it)} /></div>
                          <div className="flex justify-end mt-1.5">
                            <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => unequipSlot(slot)}>Unequip</Button>
                          </div>
                        </div>
                      );
                    })}
                    {Array.from({ length: emptyCount }).map((_, i) => (
                      <div key={`empty-${i}`} className="flex flex-col">
                        <div className="flex-1"><EmptySlotCard label="Gear" /></div>
                        <div className="h-7 mt-1.5" aria-hidden />
                      </div>
                    ))}
                    {Array.from({ length: lockedCount }).map((_, i) => {
                      const slotIndex = max + i;
                      return (
                        <div key={`locked-${i}`} className="flex flex-col">
                          <div className="flex-1"><LockedSlotCard unlocksAt={gearUnlockLevel(slotIndex)} /></div>
                          <div className="h-7 mt-1.5" aria-hidden />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }
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
                        <div className="flex-1"><EmptySlotCard label={SLOT_LABEL[slot]} /></div>
                        <div className="h-7 mt-1.5" aria-hidden />
                      </div>
                    );
                    return (
                      <div key={slot} className="flex flex-col">
                        <div className="flex-1"><ItemCard item={it} onClick={() => setSlotPicker(it)} /></div>
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
        <section className="space-y-4">
          <div className="menu-label">Owned ({owned.length})</div>
          {owned.length === 0 ? (
            <Card className="gradient-card p-4">
              <p className="text-sm text-muted-foreground italic">No items yet. Visit the shop to gear up.</p>
            </Card>
          ) : (
            (["outfit", "gear", "power"] as ItemGroup[]).map(group => {
              const groupItems = owned.filter(it => it.group === group);
              if (groupItems.length === 0) return null;
              return (
                <div key={group} className="space-y-2">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground pl-1">
                    {GROUP_LABEL[group]} ({groupItems.length})
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {groupItems.map(it => {
                      const isEquipped = !it.consumableBonus && s.equipped[it.slot] === it.id;
                      const isPrimed = !!it.consumableBonus && s.pendingConsumable === it.id;
                      return (
                        <ItemCard
                          key={it.id}
                          item={it}
                          primed={isPrimed}
                          highlight={isEquipped}
                          onClick={() => setCompareItem(it)}
                          onRemove={isAdmin ? () => {
                            if (confirm(`Remove ${it.name} from inventory?`)) {
                              removeOwnedItem(it.id);
                              toast.success(`Removed ${it.name}`);
                            }
                          } : undefined}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })
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
                    : <EmptySlotCard label={SLOT_LABEL[compareItem.slot]} />}
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
                {(() => {
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

      {/* SLOT PICKER MODAL (clicked equipped item) */}
      <Dialog open={!!slotPicker} onOpenChange={(o) => { if (!o) setSlotPicker(null); }}>
        <DialogContent className="max-w-3xl">
          {slotPicker && (
            <>
              <DialogHeader>
                <DialogTitle>Equipped · {SLOT_LABEL[slotPicker.slot]}</DialogTitle>
              </DialogHeader>
              <div className="max-w-sm mx-auto w-full">
                <ItemCard item={slotPicker} />
              </div>
              <div className="pt-2">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                  Other {SLOT_LABEL[slotPicker.slot]} you own ({slotAlternatives.length})
                </div>
                {slotAlternatives.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No other items for this slot.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {slotAlternatives.map(it => (
                      <ItemCard
                        key={it.id}
                        item={it}
                        onClick={() => { setSlotPicker(null); setCompareItem(it); }}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end pt-2">
                <Button variant="ghost" onClick={() => setSlotPicker(null)} className="bg-secondary hover:bg-muted-foreground/20 text-foreground">Close</Button>
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
  const tone = delta > 0
    ? "border-chalk-glow/50 bg-chalk-glow/10 text-chalk-glow"
    : delta < 0
      ? "border-destructive/50 bg-destructive/10 text-destructive"
      : "border-border bg-secondary text-muted-foreground";
  return (
    <div className={cn("rounded-lg border-2 px-4 py-3 flex items-center justify-between gap-4 tabular-nums", tone)}>
      <span className="text-xs uppercase tracking-wider opacity-80">Bonus change</span>
      <div className="flex items-baseline gap-3">
        <span className="text-sm opacity-70">{Math.round(cur)}% → {Math.round(nxt)}%</span>
        {delta !== 0 && <span className="text-2xl font-extrabold">{sign}{Math.round(delta)}%</span>}
      </div>
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
