import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ITEM_BY_ID, RARITY_COLOR, RARITY_BORDER, Slot, ItemGroup, Rarity } from "@/game/data";
import { equipItem, unequipSlot, useGame } from "@/game/store";
import { getItem, useCustomItems, isImageEmoji } from "@/game/customItems";
import { ClimberAvatar } from "@/components/ClimberAvatar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function ItemIcon({ emoji, alt, className, rarity }: { emoji: string; alt?: string; className?: string; rarity?: Rarity }) {
  const ring = rarity ? RARITY_BORDER[rarity] : "";
  if (isImageEmoji(emoji)) return <img src={emoji} alt={alt ?? ""} className={cn("h-8 w-8 object-contain rounded bg-background/40 p-0.5", ring, className)} />;
  return <span className={cn(rarity && "inline-flex items-center justify-center rounded bg-background/40", ring, className)}>{emoji}</span>;
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
  const consumables = items.filter(i => i.rarity === "consumable");
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
          const ownedInGroup = items.filter(it => it.rarity !== "consumable" && it.group === group);
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
                <Card className="gradient-card p-4">
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {ownedInGroup.map(it => {
                      const equipped = s.equipped[it.slot] === it.id;
                      return (
                        <div key={it.id} className={cn("p-3 rounded-lg border flex items-start gap-3", equipped ? "border-[hsl(var(--btn-orange))] ring-2 ring-[hsl(var(--btn-orange))]/40 bg-[hsl(var(--btn-orange))]/5" : "border-border bg-secondary/20")}>
                          <ItemIcon emoji={it.emoji} alt={it.name} rarity={it.rarity} className="text-2xl h-10 w-10" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold truncate">{it.name}</div>
                            <div className={cn("text-[10px] uppercase font-bold inline-block px-1 rounded border", RARITY_COLOR[it.rarity])}>{it.rarity}</div>
                            <div className="mt-2">
                              {equipped ? (
                                <span className="text-xs font-bold text-[hsl(var(--btn-orange))]">Equipped</span>
                              ) : (
                                <Button size="sm" variant="secondary" onClick={() => { equipItem(it.id); toast.success(`Equipped ${it.name}`); }}>Equip</Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}
            </section>
          );
        })}

        {consumables.length > 0 && (
          <section className="space-y-3">
            <div className="menu-label">Consumables ({consumables.length})</div>
            <Card className="gradient-card p-4">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {consumables.map((it, i) => (
                  <div key={it.id + i} className="p-3 rounded-lg border border-chalk-glow/30 bg-chalk-glow/5 flex items-start gap-3">
                    <ItemIcon emoji={it.emoji} alt={it.name} rarity={it.rarity} className="text-2xl h-10 w-10" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{it.name}</div>
                      <div className="text-[10px] text-muted-foreground">+{Math.round((it.consumableBonus ?? 0) * 100)}% next log</div>
                      <div className="mt-2">
                        <Button size="sm" variant="secondary" disabled={!!s.pendingConsumable}
                          onClick={() => { equipItem(it.id); toast.success(`Primed ${it.name} for next log`); }}>
                          {s.pendingConsumable === it.id ? "Primed" : "Use next log"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
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
