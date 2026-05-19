import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GameCard } from "@/components/ui/game-card";
import { GameButton } from "@/components/ui/game-button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { Slot, ItemGroup, Rarity, ShopItem, GEAR_SLOTS, gearSlotsUnlocked, LEVELS, BUDDY_SLOT_UNLOCK_LEVEL } from "@/game/data";
import { equipItem, unequipSlot, removeOwnedItem, sellItem, setGender, useGame, currentLevel, nextLevel } from "@/game/store";
import { getItem, useCustomItems } from "@/game/customItems";
import { ClimberAvatar } from "@/components/ClimberAvatar";
import { useAuth } from "@/hooks/useAuth";

import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ArrowRight, Lock, ShoppingBag, Pencil, Check, X } from "lucide-react";
import { ItemCard } from "@/components/ItemCard";
import { BuddyCard } from "@/components/BuddyCard";
import { LevelsModal } from "@/components/LevelsModal";
import { computeDailyCap, useDailyCapConfig } from "@/game/dailyCap";
import { useCharacterName, setCharacterName } from "@/game/characterName";
import { CharacterNameInput } from "@/components/CharacterNameInput";

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
  powerup: "Power-up",
  buddy: "Climbing Buddy",
};

const GROUP_LABEL: Record<ItemGroup, string> = {
  outfit: "Outfit",
  gear: "Gear",
  power: "Power-ups",
  buddy: "Climbing Buddy",
};

const GROUP_SLOTS: Record<ItemGroup, Slot[]> = {
  outfit: ["outfit", "bottoms", "shoes", "hat", "hand"],
  gear: GEAR_SLOTS,
  power: ["powerup"],
  buddy: ["buddy"],
};

function EmptySlotCard({ label, onClick }: { label: string; onClick?: () => void }) {
  const Comp: any = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn("w-full text-left", onClick && "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 rounded-xl")}
    >
      <GameCard interactive={!!onClick} className={cn("p-4 flex flex-col gap-3 relative h-full", onClick ? "opacity-80 hover:opacity-100 transition" : "opacity-60")}>
        <div className="flex items-start gap-3">
          <div className="h-20 w-20 flex items-center justify-center rounded-lg bg-background/40 shrink-0 border border-dashed border-border text-2xl">∅</div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium leading-snug text-muted-foreground">Empty</div>
            <div className="text-[10px] uppercase tracking-wider mt-1 text-muted-foreground">{label}</div>
            {onClick && <div className="text-[10px] mt-1 text-[hsl(var(--btn-orange))]">Click to equip</div>}
          </div>
        </div>
      </GameCard>
    </Comp>
  );
}

function LockedSlotCard({ unlocksAt, onClick }: { unlocksAt: number; onClick?: () => void }) {
  const Comp: any = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn("w-full text-left", onClick && "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 rounded-xl")}
    >
      <GameCard interactive={!!onClick} className={cn("p-4 flex flex-col gap-3 relative h-full", onClick ? "opacity-70 hover:opacity-100 transition" : "opacity-50")}>
        <div className="flex items-start gap-3">
          <div className="h-20 w-20 flex items-center justify-center rounded-lg bg-background/40 shrink-0 border border-dashed border-border">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium leading-snug text-muted-foreground">Locked</div>
            <div className="text-[10px] uppercase tracking-wider mt-1 text-muted-foreground">Unlocks at Lv {unlocksAt}</div>
            {onClick && <div className="text-[10px] mt-1 text-[hsl(var(--btn-orange))]">View levels</div>}
          </div>
        </div>
      </GameCard>
    </Comp>
  );
}

function gearUnlockLevel(slotIndex: number): number {
  // slot 0: lvl 1, slot 1: lvl 3, slot 2: lvl 5, slot 3: lvl 8
  return [1, 3, 5, 8][slotIndex] ?? 99;
}

export default function Inventory() {
  const s = useGame();
  const { isAdmin } = useAuth();
  const adminTools = isAdmin;
  useCustomItems();
  const owned = (s.owned.map(id => getItem(id)).filter(Boolean) as ShopItem[])
    .filter(it => !it.gender || it.gender === "unisex" || it.gender === s.gender);
  const totalBonusByActivity = gearBonusSummary(s.equipped);
  const specialSummary = specialBonusSummary(s.equipped);
  const dailyCapCfg = useDailyCapConfig();
  const dailyCap = computeDailyCap(s.level, dailyCapCfg);
  if (dailyCapCfg.enabled && dailyCap > 0) {
    specialSummary.push({
      label: "Daily cap",
      value: `${dailyCap.toLocaleString()} chalk`,
      tone: "text-foreground",
    });
  }

  const [compareItem, setCompareItem] = useState<ShopItem | null>(null);
  const [slotPicker, setSlotPicker] = useState<ShopItem | null>(null);
  const [emptyGearPicker, setEmptyGearPicker] = useState(false);
  const [levelsOpen, setLevelsOpen] = useState(false);
  const cur = currentLevel(s);
  const nxt = nextLevel(s);
  const canLevelUp = !!nxt && s.chalk >= nxt.cost;
  const equippedItem = compareItem
    ? (compareItem.consumableBonus
        ? (s.pendingConsumable ? getItem(s.pendingConsumable) ?? null : null)
        : (s.equipped[compareItem.slot] ? getItem(s.equipped[compareItem.slot]!) ?? null : null))
    : null;
  const slotAlternatives = slotPicker
    ? owned.filter(it => it.slot === slotPicker.slot && it.id !== slotPicker.id)
    : [];
  const equippedGearIds = new Set(GEAR_SLOTS.map(sl => s.equipped[sl]).filter(Boolean) as string[]);
  const availableGear = owned.filter(it => it.group === "gear" && !it.consumableBonus && !equippedGearIds.has(it.id));

  return (
    <div className="grid gap-6 lg:grid-cols-[320px,1fr] animate-float-up">
      <div className="space-y-4">
        <Card className="gradient-card p-5 text-center">
          <ClimberAvatar level={s.level} gender={s.gender} equipped={s.equipped} size="xl" glow />
          <CharacterNameEditor />
          {adminTools && (
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
          )}
        </Card>

        <Card className="gradient-card p-4 space-y-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Active bonuses</div>
            {totalBonusByActivity.length === 0 ? (
              <div className="text-xs text-muted-foreground italic">No equipped chalk bonuses yet.</div>
            ) : (
              <ul className="space-y-1 text-xs">
                {totalBonusByActivity.map(b => (
                  <li key={b.label} className="flex justify-between gap-2">
                    <span className="truncate">{b.label}</span><span className="text-chalk-glow shrink-0">+{Math.round(b.mult * 100)}%</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {specialSummary.length > 0 && (
            <div className="pt-2 border-t border-border/50">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Special</div>
              <ul className="space-y-1 text-xs">
                {specialSummary.map(b => (
                  <li key={b.label} className="flex justify-between gap-2">
                    <span className="truncate">{b.label}</span>
                    <span className={cn("shrink-0", b.tone)}>{b.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {s.pendingConsumable && (
            <div className="text-xs px-2 py-1.5 rounded-md bg-chalk-glow/10 border border-chalk-glow/40">
              ⚡ Next log boosted by {getItem(s.pendingConsumable)?.name}
            </div>
          )}
        </Card>
      </div>

      <div className="space-y-8">
        {/* EQUIPPED */}
        <section className="space-y-4">
          <div className="menu-label">Equipped</div>
          {(["outfit", "gear", "power", "buddy"] as ItemGroup[]).map(group => {
            if (group === "buddy") {
              const buddyId = s.equipped.buddy;
              const buddy = buddyId ? getItem(buddyId) : null;
              const unlocked = s.level >= BUDDY_SLOT_UNLOCK_LEVEL;
              return (
                <div key={group} className="space-y-2">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground pl-1">{GROUP_LABEL[group]}</div>
                  <div className="grid gap-4 grid-cols-1 sm:max-w-md">
                    {!unlocked ? (
                      <LockedSlotCard unlocksAt={BUDDY_SLOT_UNLOCK_LEVEL} onClick={() => setLevelsOpen(true)} />
                    ) : !buddy ? (
                      (() => {
                        const slotOwned = owned.filter(o => o.slot === "buddy");
                        const onClick = () => {
                          if (slotOwned.length === 0) { toast.info("No climbing buddies yet — visit the shop"); return; }
                          if (slotOwned.length === 1) { equipItem(slotOwned[0].id); toast.success(`Equipped ${slotOwned[0].name}`); return; }
                          setCompareItem(slotOwned[0]);
                        };
                        return <EmptySlotCard label="Climbing Buddy" onClick={onClick} />;
                      })()
                    ) : (
                      <div className="flex flex-col">
                        <BuddyCard item={buddy} onClick={() => setSlotPicker(buddy)} />
                        <div className="flex justify-end mt-1.5">
                          <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => unequipSlot("buddy")}>Unequip</Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            }
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
                  <div className="grid gap-4 sm:grid-cols-2">
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
                        <div className="flex-1"><EmptySlotCard label="Gear" onClick={() => setEmptyGearPicker(true)} /></div>
                        <div className="h-7 mt-1.5" aria-hidden />
                      </div>
                    ))}
                    {Array.from({ length: lockedCount }).map((_, i) => {
                      const slotIndex = max + i;
                      return (
                        <div key={`locked-${i}`} className="flex flex-col">
                          <div className="flex-1"><LockedSlotCard unlocksAt={gearUnlockLevel(slotIndex)} onClick={() => setLevelsOpen(true)} /></div>
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
                <div className="grid gap-4 sm:grid-cols-2">
                  {slots.map(slot => {
                    const id = s.equipped[slot];
                    const it = id ? getItem(id) : null;
                    if (!it) {
                      const slotOwned = owned.filter(o => o.slot === slot && !o.consumableBonus && o.id !== id);
                      const onEmptyClick = () => {
                        if (slotOwned.length === 0) { toast.info("No items for this slot — visit the shop"); return; }
                        if (slotOwned.length === 1) { equipItem(slotOwned[0].id); toast.success(`Equipped ${slotOwned[0].name}`); return; }
                        setCompareItem(slotOwned[0]);
                      };
                      return (
                        <div key={slot} className="flex flex-col">
                          <div className="flex-1"><EmptySlotCard label={SLOT_LABEL[slot]} onClick={onEmptyClick} /></div>
                          <div className="h-7 mt-1.5" aria-hidden />
                        </div>
                      );
                    }
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
            (["buddy", "outfit", "gear", "power"] as ItemGroup[]).map(group => {
              const groupItems = owned.filter(it => {
                if (it.group !== group) return false;
                // Hide equipped (non-consumable) and primed consumables — they already show in the Equipped section.
                if (it.consumableBonus) return s.pendingConsumable !== it.id;
                return s.equipped[it.slot] !== it.id;
              });
              if (groupItems.length === 0) return null;
              const isBuddy = group === "buddy";
              return (
                <div key={group} className="space-y-2">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground pl-1">
                    {GROUP_LABEL[group]} ({groupItems.length})
                  </div>
                  <div className={cn("grid gap-4", isBuddy ? "sm:grid-cols-2" : "sm:grid-cols-2")}>
                    {groupItems.map(it => {
                      const isPrimed = !!it.consumableBonus && s.pendingConsumable === it.id;
                      const removeFn = adminTools ? () => {
                        if (confirm(`Remove ${it.name} from inventory?`)) {
                          removeOwnedItem(it.id);
                          toast.success(`Removed ${it.name}`);
                        }
                      } : undefined;
                      if (isBuddy) {
                        return (
                          <BuddyCard
                            key={it.id}
                            item={it}
                            onClick={() => setCompareItem(it)}
                            onRemove={removeFn}
                          />
                        );
                      }
                      return (
                        <ItemCard
                          key={it.id}
                          item={it}
                          primed={isPrimed}
                          onClick={() => setCompareItem(it)}
                          onRemove={removeFn}
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

              <div className="flex justify-end gap-2 pt-2 flex-wrap">
                <Button variant="ghost" onClick={() => setCompareItem(null)} className="bg-secondary hover:bg-muted-foreground/20 text-foreground">Close</Button>
                {s.owned.includes(compareItem.id) && !compareItem.consumableBonus && (compareItem.price ?? 0) > 0 && (() => {
                  const refund = Math.floor((compareItem.price ?? 0) / 2);
                  return (
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (!confirm(`Sell ${compareItem.name} for ${refund} chalk? This won't count toward total chalk earned.`)) return;
                        const r = sellItem(compareItem.id);
                        if (!r.ok) { toast.error(r.reason ?? "Cannot sell"); return; }
                        toast.success(`Sold ${compareItem.name} · +${r.refund} chalk`);
                        setCompareItem(null);
                      }}
                    >
                      Sell · {refund} chalk
                    </Button>
                  );
                })()}
                {(() => {
                  const alreadyOn = compareItem.consumableBonus
                    ? s.pendingConsumable === compareItem.id
                    : s.equipped[compareItem.slot] === compareItem.id;
                  return (
                    <GameButton
                      variant="primary"
                      disabled={alreadyOn}
                      onClick={() => {
                        const r = equipItem(compareItem.id);
                        if (!r.ok) { toast.error(r.reason ?? "Cannot equip"); return; }
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
                  <div className="grid gap-4 sm:grid-cols-2">
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

      {/* EMPTY GEAR PICKER */}
      <Dialog open={emptyGearPicker} onOpenChange={setEmptyGearPicker}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Equip gear</DialogTitle>
          </DialogHeader>
          {availableGear.length === 0 ? (
            <div className="py-8 text-center space-y-4">
              <div className="text-5xl">🎒</div>
              <p className="text-sm text-muted-foreground">You don't have any gear to equip yet.</p>
              <Link to="/shop" onClick={() => setEmptyGearPicker(false)}>
                <GameButton variant="primary"><ShoppingBag className="h-4 w-4" /> Go to shop</GameButton>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {availableGear.map(it => (
                <ItemCard
                  key={it.id}
                  item={it}
                  onClick={() => {
                    const r = equipItem(it.id);
                    if (!r.ok) { toast.error(r.reason ?? "Cannot equip"); return; }
                    toast.success(`Equipped ${it.name}`);
                    setEmptyGearPicker(false);
                  }}
                />
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <LevelsModal
        open={levelsOpen}
        onOpenChange={setLevelsOpen}
        currentLevel={s.level}
        gender={s.gender}
        canLevelUp={canLevelUp}
        nextCost={nxt?.cost}
        onLevelUpClick={() => { setLevelsOpen(false); window.dispatchEvent(new CustomEvent("cq:open-level-up-confirm")); }}
      />
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

function specialBonusSummary(eq: ReturnType<typeof useGame>["equipped"]) {
  const equipped: ShopItem[] = Object.values(eq)
    .map(id => (id ? getItem(id) : null))
    .filter(Boolean) as ShopItem[];

  const out: { label: string; value: string; tone: string }[] = [];

  // Shop discount — best (lowest) priceMult, non-stacking.
  let bestMult = 1;
  for (const it of equipped) {
    if (it.priceMult && it.priceMult < bestMult) bestMult = it.priceMult;
  }
  if (bestMult < 1) {
    out.push({
      label: "Shop discount",
      value: `−${Math.round((1 - bestMult) * 100)}%`,
      tone: "text-[hsl(var(--btn-orange))]",
    });
  }

  // Crit chance — combined via 1 - Π(1 - p).
  let critProb = 0;
  for (const it of equipped) {
    if (it.critChancePct && it.critChancePct > 0) {
      const p = Math.max(0, Math.min(100, it.critChancePct)) / 100;
      critProb = 1 - (1 - critProb) * (1 - p);
    }
  }
  if (critProb > 0) {
    out.push({
      label: "Crit chance (×2)",
      value: `${Math.round(critProb * 100)}%`,
      tone: "text-chalk-glow",
    });
  }

  // Boss bonus — sum across items.
  const bossPct = equipped.reduce((sum, it) => sum + (it.bossBonusPct ?? 0), 0);
  if (bossPct > 0) {
    out.push({
      label: "Boss attempts/sends",
      value: `+${Math.round(bossPct)}%`,
      tone: "text-destructive",
    });
  }

  return out;
}

function CharacterNameEditor() {
  const name = useCharacterName();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [valid, setValid] = useState(false);
  const [busy, setBusy] = useState(false);

  function start() { setDraft(name ?? ""); setEditing(true); }
  async function save() {
    if (!valid) return;
    setBusy(true);
    const r = await setCharacterName(draft);
    setBusy(false);
    if (!r.ok) { toast.error((r as any).error); return; }
    toast.success("Name updated");
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="mt-4 space-y-2 text-left">
        <CharacterNameInput value={draft} onChange={setDraft} onValidityChange={setValid} currentName={name} autoFocus />
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={busy}><X className="h-4 w-4" /> Cancel</Button>
          <Button size="sm" onClick={save} disabled={!valid || busy}><Check className="h-4 w-4" /> Save</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 flex items-center justify-center gap-2">
      <div className="text-base font-bold">{name ?? <span className="text-muted-foreground italic">Unnamed climber</span>}</div>
      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={start} aria-label="Edit name">
        <Pencil className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

