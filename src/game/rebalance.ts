// Pure rebalance proposal. Computes target prices, bonus %, discount %,
// crit chance %, and boss bonus % for every shop item, plus target activity rewards.
import { ActivityType, BASE_CHALK, Rarity, ShopItem, Slot } from "./data";

const RARITY_BASE_PRICE: Record<Rarity, number> = {
  common: 80, rare: 700, epic: 7000, legendary: 100000,
};
const RARITY_BONUS: Record<Rarity, number> = {
  common: 2, rare: 6, epic: 15, legendary: 35,
};
const SLOT_PRICE_WEIGHT: Partial<Record<Slot, number>> = {
  shoes: 1.1, study: 1.2, chalk: 1.0, aura: 1.15, accessory: 1.05, powerup: 1.25,
};
const SLOT_BONUS_ADJ: Partial<Record<Slot, number>> = {
  aura: 5,
};

function hasBothEffects(r: Rarity): boolean {
  return r === "epic" || r === "legendary";
}

function niceRound(n: number): number {
  if (n <= 0) return 0;
  if (n < 100) return Math.round(n / 5) * 5;
  if (n < 1000) return Math.round(n / 25) * 25;
  if (n < 10000) return Math.round(n / 100) * 100;
  if (n < 100000) return Math.round(n / 500) * 500;
  return Math.round(n / 5000) * 5000;
}

export function targetBonusPct(item: ShopItem): number {
  const base = RARITY_BONUS[item.rarity] ?? 0;
  const slotAdj = SLOT_BONUS_ADJ[item.slot] ?? 0;
  // Low-rarity study items are discount-only.
  if (item.slot === "study" && !hasBothEffects(item.rarity)) return 0;
  // Power-up slot has dedicated effects (crit/boss); generic bonus dampened.
  if (item.slot === "powerup") return Math.max(0, Math.round(base * 0.5));
  // Epic/legendary study items still earn a small bonus alongside their discount.
  if (item.slot === "study" && hasBothEffects(item.rarity)) {
    return Math.max(0, Math.round(base * 0.5));
  }
  return Math.max(0, base + slotAdj);
}

export function targetDiscountPct(item: ShopItem): number {
  // Low-rarity: only Study items get a discount.
  if (!hasBothEffects(item.rarity)) {
    if (item.slot !== "study") return 0;
    return item.rarity === "rare" ? 5 : 0;
  }
  // Power-ups lean into crit/boss instead of discount.
  if (item.slot === "powerup") return item.rarity === "epic" ? 5 : 10;
  // Epic/legendary: every item gets a discount. Study slot gets the strongest.
  if (item.slot === "study") return item.rarity === "epic" ? 15 : 30;
  return item.rarity === "epic" ? 10 : 20;
}

/** Crit chance — only epic/legendary, full strength on power-ups, half on others. */
export function targetCritPct(item: ShopItem): number {
  if (!hasBothEffects(item.rarity)) return 0;
  const base = item.rarity === "epic" ? 5 : 12;
  if (item.slot === "powerup") return base;
  if (item.slot === "study") return 0;
  return Math.round(base * 0.5);
}

/** Boss bonus % — only epic/legendary, full on power-ups, half on others. */
export function targetBossBonusPct(item: ShopItem): number {
  if (!hasBothEffects(item.rarity)) return 0;
  const base = item.rarity === "epic" ? 8 : 20;
  if (item.slot === "powerup") return base;
  if (item.slot === "study") return 0;
  return Math.round(base * 0.5);
}

export function targetPrice(item: ShopItem): number {
  const base = RARITY_BASE_PRICE[item.rarity] ?? 100;
  const lvl = Math.max(1, item.levelReq ?? 1);
  const lvlMult = Math.pow(1.18, lvl - 1);
  const slotMult = SLOT_PRICE_WEIGHT[item.slot] ?? 1.0;
  const bonusPct = targetBonusPct(item);
  const discountPct = targetDiscountPct(item);
  const critPct = targetCritPct(item);
  const bossPct = targetBossBonusPct(item);
  // Crit weighted ×1.5 because it doubles all chalk; others ×1.
  const valueMult = 1 + (bonusPct + discountPct + critPct * 1.5 + bossPct) * 0.005;
  return niceRound(base * lvlMult * slotMult * valueMult);
}

const TARGET_ACTIVITY: Record<ActivityType, number> = {
  warmup_boulder: 20,
  boulder: 60,
  hard_boulder: 140,
  boulder_send: 45,
  boss_attempt: 55,
  boss_send: 350,
};

export interface ItemDiff {
  item: ShopItem;
  now: { price: number; bonusPct: number; discountPct: number; critPct: number; bossPct: number };
  next: { price: number; bonusPct: number; discountPct: number; critPct: number; bossPct: number };
  changed: boolean;
}

export interface ActivityDiff {
  activity: ActivityType;
  now: number;
  next: number;
  changed: boolean;
}

export function proposeRebalance(
  items: ShopItem[],
  currentRewards: Record<ActivityType, number>,
): { items: ItemDiff[]; activities: ActivityDiff[] } {
  const itemDiffs: ItemDiff[] = items.map(item => {
    const nowBonus = item.bonus ? Math.round(item.bonus.mult * 100) : 0;
    const nowDisc = item.priceMult ? Math.round((1 - item.priceMult) * 100) : 0;
    const nowCrit = item.critChancePct ?? 0;
    const nowBoss = item.bossBonusPct ?? 0;
    const next = {
      price: targetPrice(item),
      bonusPct: targetBonusPct(item),
      discountPct: targetDiscountPct(item),
      critPct: targetCritPct(item),
      bossPct: targetBossBonusPct(item),
    };
    const now = { price: item.price, bonusPct: nowBonus, discountPct: nowDisc, critPct: nowCrit, bossPct: nowBoss };
    const changed =
      next.price !== now.price ||
      next.bonusPct !== now.bonusPct ||
      next.discountPct !== now.discountPct ||
      next.critPct !== now.critPct ||
      next.bossPct !== now.bossPct;
    return { item, now, next, changed };
  });

  const activities: ActivityDiff[] = (Object.keys(BASE_CHALK) as ActivityType[]).map(a => {
    const now = currentRewards[a] ?? BASE_CHALK[a];
    const next = TARGET_ACTIVITY[a];
    return { activity: a, now, next, changed: now !== next };
  });

  return { items: itemDiffs, activities };
}
