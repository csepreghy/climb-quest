// Pure rebalance proposal. Computes target prices, bonus %, discount %,
// crit chance %, and boss bonus % for every shop item, plus target activity rewards.
//
// Equip-cap aware: endgame a player can equip
//   5 outfit slots + 4 gear slots + 1 powerup slot = 10 items.
// Per-item magnitudes are sized so a fully-decked all-legendary loadout
// approaches the design ceilings below — so adding a 1001st item never
// inflates effects beyond what the cap allows.
import { ActivityType, BASE_CHALK, GROUP_EFFECTS, Rarity, ShopItem, Slot } from "./data";

const RARITY_BASE_PRICE: Record<Rarity, number> = {
  common: 80, rare: 700, epic: 7000, legendary: 100000,
};

/** Rarity contribution factor — legendary is full strength. */
const RARITY_FACTOR: Record<Rarity, number> = {
  common: 0.05, rare: 0.2, epic: 0.5, legendary: 1.0,
};

/** Per-slot share of the endgame budget (relative weight). */
const SLOT_SHARE: Record<Slot, number> = {
  // outfit (5 slots) — mostly cosmetic, small share each
  outfit: 0.4, bottoms: 0.4, shoes: 0.4, hat: 0.4, hand: 0.4,
  // gear (up to 4 slots) — meaningful share each
  chalk: 1.0, accessory: 1.0, study: 1.0,
  // powerup (1 slot) — concentrated
  powerup: 2.0,
  // legacy slots (kept equipable for back-compat)
  aura: 0.6, title: 0.4,
};

/** Sum of shares for an endgame loadout = 5×0.4 + 3×1.0 + 1×2.0 = 7.0
 *  (the 4th gear slot adds another 1.0 → 8.0 at level 8). Use 8 as the divisor. */
const ENDGAME_SHARE_SUM = 8.0;

/** Design ceilings when a 10-item loadout is fully legendary. */
export const ENDGAME_CEILING = {
  /** Effective multiplicative chalk bonus, e.g. 1.5 = +150%. */
  bonus: 1.5,
  /** Best-wins shop discount — single item caps. */
  discount: 0.30,
  /** Combined crit probability via 1 − Π(1 − p_i). */
  crit: 0.35,
  /** Sum of bossBonusPct across loadout. */
  boss: 0.60,
};

/** Per-rarity discount targets (best-wins, doesn't stack). */
const DISCOUNT_BY_RARITY: Record<Rarity, number> = {
  common: 0, rare: 5, epic: 15, legendary: 30,
};

/** Slots that can roll discount (study-leaning + powerups). */
function canDiscount(slot: Slot): boolean {
  return slot === "study" || slot === "powerup" || slot === "accessory";
}

/** Slots that can roll crit / boss bonuses. */
function canSpecial(slot: Slot): boolean {
  // Only epic/legendary special items, and only on gear or powerup slots.
  return slot === "powerup" || slot === "chalk" || slot === "accessory" || slot === "study";
}

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

/**
 * Generic chalk bonus %.
 * Sized so Π(1 + p_i) across an all-legendary endgame loadout ≈ 1 + ENDGAME_CEILING.bonus.
 * Per-legendary share: ln(1 + ceiling) × share / sumShare.
 */
export function targetBonusPct(item: ShopItem): number {
  if (!GROUP_EFFECTS[item.group].chalk) return 0;
  const share = SLOT_SHARE[item.slot] ?? 0.4;
  const factor = RARITY_FACTOR[item.rarity];
  // Power-ups lean into crit/boss — dampen generic bonus.
  const slotDampen = item.slot === "powerup" ? 0.4 : 1.0;
  // Study slot is discount-leaning at low rarity; small bonus only at epic+.
  if (item.slot === "study" && !hasBothEffects(item.rarity)) return 0;
  const studyDampen = item.slot === "study" ? 0.5 : 1.0;
  const budget = Math.log(1 + ENDGAME_CEILING.bonus); // ≈ 0.916
  const pct = (budget * share / ENDGAME_SHARE_SUM) * factor * slotDampen * studyDampen * 100;
  return Math.max(0, Math.round(pct));
}

/** Shop discount % — non-stacking (best wins), so per-item just maps from rarity. */
export function targetDiscountPct(item: ShopItem): number {
  if (!GROUP_EFFECTS[item.group].discount) return 0;
  if (!canDiscount(item.slot)) return 0;
  // Only study + powerup get discounts at low rarity.
  if (!hasBothEffects(item.rarity)) {
    if (item.slot === "study") return DISCOUNT_BY_RARITY[item.rarity];
    return 0;
  }
  // Epic/legendary: study slot gets the strongest, others get a smaller cut.
  const base = DISCOUNT_BY_RARITY[item.rarity];
  if (item.slot === "study") return base;
  if (item.slot === "powerup") return Math.round(base * 0.4);
  return Math.round(base * 0.5);
}

/**
 * Crit chance %. Only epic/legendary on special-eligible slots.
 * Sized so 1 − Π(1 − p_i) at endgame ≈ ENDGAME_CEILING.crit.
 */
export function targetCritPct(item: ShopItem): number {
  if (!GROUP_EFFECTS[item.group].crit) return 0;
  if (!hasBothEffects(item.rarity)) return 0;
  if (!canSpecial(item.slot)) return 0;
  const share = SLOT_SHARE[item.slot] ?? 0;
  const factor = RARITY_FACTOR[item.rarity];
  const budget = -Math.log(1 - ENDGAME_CEILING.crit); // ≈ 0.431
  // Crit-eligible slots are gear (3×1.0) + powerup (2.0) = 5.0 share
  const critShareSum = 5.0;
  // Powerup leans heavier into crit.
  const slotBoost = item.slot === "powerup" ? 1.4 : 1.0;
  const pct = (budget * share / critShareSum) * factor * slotBoost * 100;
  return Math.max(0, Math.round(pct));
}

/**
 * Boss bonus % (additive). Only epic/legendary on special-eligible slots.
 * Sized so the sum across an endgame loadout ≈ ENDGAME_CEILING.boss × 100.
 */
export function targetBossBonusPct(item: ShopItem): number {
  if (!GROUP_EFFECTS[item.group].boss) return 0;
  if (!hasBothEffects(item.rarity)) return 0;
  if (!canSpecial(item.slot)) return 0;
  const share = SLOT_SHARE[item.slot] ?? 0;
  const factor = RARITY_FACTOR[item.rarity];
  const bossShareSum = 5.0;
  const slotBoost = item.slot === "powerup" ? 1.5 : 1.0;
  const pct = (ENDGAME_CEILING.boss * 100 * share / bossShareSum) * factor * slotBoost;
  return Math.max(0, Math.round(pct));
}

export function targetPrice(item: ShopItem): number {
  const base = RARITY_BASE_PRICE[item.rarity] ?? 100;
  const lvl = Math.max(1, item.levelReq ?? 1);
  const lvlMult = Math.pow(1.18, lvl - 1);
  const bonusPct = targetBonusPct(item);
  const discountPct = targetDiscountPct(item);
  const critPct = targetCritPct(item);
  const bossPct = targetBossBonusPct(item);
  // Crit weighted ×1.5 because it doubles all chalk; others ×1.
  const valueMult = 1 + (bonusPct + discountPct + critPct * 1.5 + bossPct) * 0.005;
  return niceRound(base * lvlMult * valueMult);
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
    // No useless items: if every effect rounded to 0, give the group's
    // primary effect a minimum value scaled by rarity.
    if (next.bonusPct === 0 && next.discountPct === 0 && next.critPct === 0 && next.bossPct === 0) {
      const floor = item.rarity === "legendary" ? 5 : item.rarity === "epic" ? 3 : item.rarity === "rare" ? 2 : 1;
      const allow = GROUP_EFFECTS[item.group];
      if (allow.chalk) next.bonusPct = floor;
      else if (allow.boss) next.bossPct = floor;
      else if (allow.crit) next.critPct = floor;
      else if (allow.discount) next.discountPct = floor;
    }
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
