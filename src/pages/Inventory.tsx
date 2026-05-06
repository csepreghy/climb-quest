import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GameCard } from "@/components/ui/game-card";
import { GameButton } from "@/components/ui/game-button";
import { ITEM_BY_ID, RARITY_COLOR, RARITY_BORDER, Slot, ItemGroup, Rarity, ShopItem } from "@/game/data";
import { equipItem, unequipSlot, useGame } from "@/game/store";
import { getItem, useCustomItems, isImageEmoji } from "@/game/customItems";
import { ClimberAvatar } from "@/components/ClimberAvatar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Check } from "lucide-react";

function ItemIcon({ emoji, alt, className, rarity }: { emoji: string; alt?: string; className?: string; rarity?: Rarity }) {
  const ring = rarity ? RARITY_BORDER[rarity] : "";
  if (isImageEmoji(emoji)) return <img src={emoji} alt={alt ?? ""} className={cn("object-contain rounded bg-background/40 p-0.5", ring, className)} />;
  return <span className={cn("inline-flex items-center justify-center rounded leading-none", rarity && "bg-background/40", ring, className)}>{emoji}</span>;
}

function InventoryCard({ item, equipped, onEquip, primed, disabled }: { item: ShopItem; equipped?: boolean; onEquip: () => void; primed?: boolean; disabled?: boolean }) {
  const tone = item.rarity === "legendary" ? "legendary" : item.rarity === "rare" ? "rare" : "default";
  const bonusPct = item.bonus?.mult ? Math.round(item.bonus.mult * 100) : 0;
  const isConsumable = !!item.consumableBonus;
  return (
    <GameCard tone={tone as "default"} shimmer={item.rarity === "legendary"} className="p-4 flex flex-col gap-3 relative">
      {bonusPct > 0 && (
        <div className="absolute top-2 right-2 z-10 text-[11px] font-bold tabular-nums px-2 py-0.5 rounded-md bg-chalk-glow/15 text-chalk-glow border border-chalk-glow/40">
          +{bonusPct}%
        </div>
      )}
      {isConsumable && (
        <div className="absolute top-2 right-2 z-10 text-[11px] font-bold tabular-nums px-2 py-0.5 rounded-md bg-chalk-glow/15 text-chalk-glow border border-chalk-glow/40">
          +{Math.round((item.consumableBonus ?? 0) * 100)}%
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
        </div>
      </div>
      {item.desc && <p className="text-xs text-muted-foreground flex-1 leading-relaxed">{item.desc}</p>}
      <div className="flex items-center justify-end pt-2 border-t border-border/50">
        {equipped || primed ? (
          <GameButton size="sm" variant="ghost" disabled><Check className="h-3 w-3" /> {primed ? "Primed" : "Equipped"}</GameButton>
        ) : (
          <GameButton size="sm" variant="primary" disabled={disabled} onClick={onEquip}>
            {isConsumable ? "Prime" : "Equip"}
          </GameButton>
        )}
      </div>
    </GameCard>
  );
}

const SLOT_LABEL: Record<Slot, string> = {
  outfit: "Top",
  bottoms: "Bottom",
  shoes: "Shoes",
  hat: "Hat",
  hand: "Hand",
  chalk: "Chalk",
  accessory: "Brush / Accessory",
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

export default function Inventory() {
  const s = useGame();
  useCustomItems(); // subscribe so admin updates re-render
  const items = s.owned.map(id => getItem(id)).filter(Boolean) as ReturnType<typeof getItem>[] as NonNullable<ReturnType<typeof getItem>>[];
  const consumables = items.filter(i => !!i.consumableBonus);
  const totalBonusByActivity = gearBonusSummary(s.equipped);

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

      <div className="space-y-6">
        {(["outfit", "gear", "power"] as ItemGroup[]).map(group => {
          const slots = GROUP_SLOTS[group];
          const ownedInGroup = items.filter(it => !it.consumableBonus && it.group === group);
          return (
            <section key={group} className="space-y-3">
              <div className="menu-label">{GROUP_LABEL[group]}</div>

              <Card className="gradient-card p-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  {slots.map(slot => {
                    const id = s.equipped[slot];
                    const it = id ? getItem(id) : null;
                    return (
                      <div key={slot} className="flex items-center justify-between gap-2 p-3 rounded-lg border border-border bg-secondary/30">
                        <div className="min-w-0">
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{SLOT_LABEL[slot]}</div>
                          <div className="font-medium truncate flex items-center gap-2">{it ? <><ItemIcon emoji={it.emoji} alt={it.name} className="h-5 w-5" /> {it.name}</> : <span className="italic text-muted-foreground">empty</span>}</div>
                        </div>
                        {it && it.id !== "rental_shoes" && it.id !== "plain_chalk" && (
                          <Button size="sm" variant="ghost" onClick={() => unequipSlot(slot)}>Remove</Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>

              {ownedInGroup.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {ownedInGroup.map(it => {
                    const equipped = s.equipped[it.slot] === it.id;
                    return (
                      <InventoryCard
                        key={it.id}
                        item={it}
                        equipped={equipped}
                        onEquip={() => { equipItem(it.id); toast.success(`Equipped ${it.name}`); }}
                      />
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}

        {consumables.length > 0 && (
          <section className="space-y-3">
            <div className="menu-label">Consumables ({consumables.length})</div>
            <Card className="gradient-card p-4">
              <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 lg:grid-cols-5">
                {consumables.map((it, i) => {
                  const primed = s.pendingConsumable === it.id;
                  return (
                    <button
                      key={it.id + i}
                      title={`${it.name} · +${Math.round((it.consumableBonus ?? 0) * 100)}% next log`}
                      disabled={!!s.pendingConsumable && !primed}
                      onClick={() => { equipItem(it.id); toast.success(`Primed ${it.name} for next log`); }}
                      className={cn(
                        "aspect-square p-2 rounded-lg border flex items-center justify-center transition-colors",
                        primed
                          ? "border-chalk-glow ring-2 ring-chalk-glow/40 bg-chalk-glow/10"
                          : "border-chalk-glow/30 bg-chalk-glow/5 hover:bg-chalk-glow/10 disabled:opacity-50"
                      )}
                    >
                      <ItemIcon emoji={it.emoji} alt={it.name} rarity={it.rarity} className="text-5xl h-full w-full" />
                    </button>
                  );
                })}
              </div>
            </Card>
          </section>
        )}
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
