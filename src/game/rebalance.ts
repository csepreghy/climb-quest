// Pure rebalance proposal. Computes target prices, bonus %, and discount %
// for every shop item, plus target activity rewards.
import { ActivityType, BASE_CHALK, Rarity, ShopItem, Slot } from "./data";

const RARITY_BASE_PRICE: Record<Rarity, number> = {
  common: 80, rare: 700, epic: 7000, legendary: 100000,
};
const RARITY_BONUS: Record<Rarity, number> = {
  common: 2, rare: 6, epic: 15, legendary: 35,
};
const SLOT_PRICE_WEIGHT: Partial<Record<Slot, number>> = {
  shoes: 1.1, study: 1.2, chalk: 1.0, aura: 1.15, accessory: 1.05,
};
const SLOT_BONUS_ADJ: Partial<Record<Slot, number>> = {
  aura: 5, study: -999, // study uses discount, not chalk bonus
};

function niceRound(n: number): number {
  if (n <= 0) return 0;
  if (n < 100) return Math.round(n / 5) * 5;
  if (n < 1000) return Math.round(n / 25) * 25;
  if (n < 10000) return Math.round(n / 100) * 100;
  if (n < 100000) return Math.round(n / 500) * 500;
  return Math.round(n / 5000) * 5000;
}

export function targetPrice(item: ShopItem): number {
  const base = RARITY_BASE_PRICE[item.rarity] ?? 100;
  const lvl = Math.max(1, item.levelReq ?? 1);
  const lvlMult = Math.pow(1.18, lvl - 1);
  const slotMult = SLOT_PRICE_WEIGHT[item.slot] ?? 1.0;
  return niceRound(base * lvlMult * slotMult);
}

export function targetBonusPct(item: ShopItem): number {
  const adj = SLOT_BONUS_ADJ[item.slot];
  if (adj === -999) return 0;
  const base = RARITY_BONUS[item.rarity] ?? 0;
  return Math.max(0, base + (adj ?? 0));
}

export function targetDiscountPct(item: ShopItem): number {
  if (item.slot !== "study") return 0;
  switch (item.rarity) {
    case "rare": return 5;
    case "epic": return 15;
    case "legendary": return 30;
    default: return 0;
  }
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
  now: { price: number; bonusPct: number; discountPct: number };
  next: { price: number; bonusPct: number; discountPct: number };
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
    const nextPrice = targetPrice(item);
    const nextBonus = targetBonusPct(item);
    const nextDisc = targetDiscountPct(item);
    return {
      item,
      now: { price: item.price, bonusPct: nowBonus, discountPct: nowDisc },
      next: { price: nextPrice, bonusPct: nextBonus, discountPct: nextDisc },
      changed: nextPrice !== item.price || nextBonus !== nowBonus || nextDisc !== nowDisc,
    };
  });

  const activities: ActivityDiff[] = (Object.keys(BASE_CHALK) as ActivityType[]).map(a => {
    const now = currentRewards[a] ?? BASE_CHALK[a];
    const next = TARGET_ACTIVITY[a];
    return { activity: a, now, next, changed: now !== next };
  });

  return { items: itemDiffs, activities };
}
