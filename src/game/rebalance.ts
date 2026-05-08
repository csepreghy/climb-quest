// Pure rebalance proposal. Computes target prices, bonus %, discount %,
// crit chance %, and boss bonus % for every shop item, plus target activity rewards.
//
// Equip-cap aware: endgame a player can equip
//   5 outfit slots + 4 gear slots + 1 powerup slot = 10 items.
// Per-item magnitudes are sized so a fully-decked all-legendary loadout
// approaches the design ceilings below — so adding a 1001st item never
// inflates effects beyond what the cap allows.
import { ActivityType, BASE_CHALK, effectAllowed, Rarity, ShopItem, Slot } from "./data";

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

/** Outfit chalk bonus magnitudes — generous so high-rarity outfits feel meaningful. */
const CHALK_BONUS_OUTFIT: Record<Rarity, number> = {
  common: 3, rare: 10, epic: 22, legendary: 40,
};

/** Power-up chalk bonus magnitudes — smaller (only 1 slot, so per-item can't dominate). */
const CHALK_BONUS_POWER: Record<Rarity, number> = {
  common: 1, rare: 4, epic: 9, legendary: 16,
};

/** At epic rarity each item leans into either crit or boss. Legendary gets both. */
const EPIC_LEAN: Record<Slot, "crit" | "boss"> = {
  // crit-leaning (precision / focus / chalk-mgmt slots)
  chalk: "crit", study: "crit", accessory: "crit", hat: "crit", hand: "crit", aura: "crit",
  // boss-leaning (big-effort / power slots)
  powerup: "boss", outfit: "boss", bottoms: "boss", shoes: "boss", title: "boss",
};

/** Per-rarity crit chance contributed by one item. */
const CRIT_BY_RARITY: Record<Rarity, number> = {
  common: 1, rare: 3, epic: 5, legendary: 10,
};

/** Per-rarity boss bonus contributed by one item. */
const BOSS_BY_RARITY: Record<Rarity, number> = {
  common: 2, rare: 5, epic: 8, legendary: 15,
};

/** Slots that can roll discount (study-leaning + powerups). */
function canDiscount(slot: Slot): boolean {
  return slot === "study" || slot === "powerup" || slot === "accessory";
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

/** Generic chalk bonus % — table-driven per group. */
export function targetBonusPct(item: ShopItem): number {
  if (!effectAllowed(item.group, item.rarity, "chalk")) return 0;
  if (item.group === "outfit") return CHALK_BONUS_OUTFIT[item.rarity];
  if (item.group === "power")  return CHALK_BONUS_POWER[item.rarity];
  return 0;
}

/** Shop discount % — non-stacking (best wins). Power-ups only, epic+. */
export function targetDiscountPct(item: ShopItem): number {
  if (!effectAllowed(item.group, item.rarity, "discount")) return 0;
  if (!canDiscount(item.slot)) return 0;
  if (!hasBothEffects(item.rarity)) {
    if (item.slot === "study") return DISCOUNT_BY_RARITY[item.rarity];
    return 0;
  }
  const base = DISCOUNT_BY_RARITY[item.rarity];
  if (item.slot === "study") return base;
  if (item.slot === "powerup") return Math.round(base * 0.4);
  return Math.round(base * 0.5);
}

/** Crit chance %. Epic = only if slot leans crit; Legendary = always. */
export function targetCritPct(item: ShopItem): number {
  if (!effectAllowed(item.group, item.rarity, "crit")) return 0;
  if (item.rarity !== "legendary" && EPIC_LEAN[item.slot] !== "crit") return 0;
  const base = CRIT_BY_RARITY[item.rarity];
  // Powerups punch a bit harder.
  const slotBoost = item.slot === "powerup" ? 1.4 : 1.0;
  return Math.max(0, Math.round(base * slotBoost));
}

/** Boss bonus % (additive). Epic = only if slot leans boss; Legendary = always. */
export function targetBossBonusPct(item: ShopItem): number {
  if (!effectAllowed(item.group, item.rarity, "boss")) return 0;
  if (item.rarity !== "legendary" && EPIC_LEAN[item.slot] !== "boss") return 0;
  const base = BOSS_BY_RARITY[item.rarity];
  const slotBoost = item.slot === "powerup" ? 1.5 : 1.0;
  return Math.max(0, Math.round(base * slotBoost));
}

/** Lowest level at which an item of this rarity may unlock. */
const MIN_LEVEL_BY_RARITY: Record<Rarity, number> = {
  common: 1, rare: 2, epic: 4, legendary: 6,
};
const MAX_LEVEL = 10;

/** Raw value used to rank items within a rarity (cheaper items unlock first). */
function rawValue(item: ShopItem): number {
  const base = RARITY_BASE_PRICE[item.rarity] ?? 100;
  const bonusPct = targetBonusPct(item);
  const discountPct = targetDiscountPct(item);
  const critPct = targetCritPct(item);
  const bossPct = targetBossBonusPct(item);
  const valueMult = 1 + (bonusPct + discountPct + critPct * 1.5 + bossPct) * 0.005;
  return base * valueMult;
}

export function targetPrice(item: ShopItem, levelReq: number): number {
  const base = RARITY_BASE_PRICE[item.rarity] ?? 100;
  const lvl = Math.max(1, levelReq);
  const lvlMult = Math.pow(1.18, lvl - 1);
  const bonusPct = targetBonusPct(item);
  const discountPct = targetDiscountPct(item);
  const critPct = targetCritPct(item);
  const bossPct = targetBossBonusPct(item);
  const valueMult = 1 + (bonusPct + discountPct + critPct * 1.5 + bossPct) * 0.005;
  return niceRound(base * lvlMult * valueMult);
}

/** Assign a level requirement per item: cheaper-first within rarity, respecting the rarity floor. */
function computeLevelReqs(items: ShopItem[]): Map<string, number> {
  const out = new Map<string, number>();
  const groups: Record<Rarity, ShopItem[]> = { common: [], rare: [], epic: [], legendary: [] };
  for (const it of items) groups[it.rarity].push(it);
  (Object.keys(groups) as Rarity[]).forEach(r => {
    const list = groups[r].slice().sort((a, b) => {
      const av = rawValue(a), bv = rawValue(b);
      if (av !== bv) return av - bv;
      return a.id.localeCompare(b.id); // stable tie-break
    });
    const min = MIN_LEVEL_BY_RARITY[r];
    const span = Math.max(0, MAX_LEVEL - min);
    const n = list.length;
    list.forEach((it, i) => {
      const lvl = n <= 1 ? min : min + Math.round((i * span) / (n - 1));
      out.set(it.id, Math.min(MAX_LEVEL, Math.max(min, lvl)));
    });
  });
  return out;
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
  now: { price: number; bonusPct: number; discountPct: number; critPct: number; bossPct: number; levelReq: number };
  next: { price: number; bonusPct: number; discountPct: number; critPct: number; bossPct: number; levelReq: number };
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
  const levelReqs = computeLevelReqs(items);
  const itemDiffs: ItemDiff[] = items.map(item => {
    const nowBonus = item.bonus ? Math.round(item.bonus.mult * 100) : 0;
    const nowDisc = item.priceMult ? Math.round((1 - item.priceMult) * 100) : 0;
    const nowCrit = item.critChancePct ?? 0;
    const nowBoss = item.bossBonusPct ?? 0;
    const nowLvl = item.levelReq ?? 1;
    const nextLvl = levelReqs.get(item.id) ?? MIN_LEVEL_BY_RARITY[item.rarity];
    const next = {
      price: targetPrice(item, nextLvl),
      bonusPct: targetBonusPct(item),
      discountPct: targetDiscountPct(item),
      critPct: targetCritPct(item),
      bossPct: targetBossBonusPct(item),
      levelReq: nextLvl,
    };
    // Cap at 3 effects per item: if all four would roll, drop the smallest
    // and redistribute its weight by bumping the remaining three by ~33%.
    {
      const effects: Array<"bonusPct" | "discountPct" | "critPct" | "bossPct"> =
        ["bonusPct", "discountPct", "critPct", "bossPct"];
      const active = effects.filter(k => next[k] > 0);
      if (active.length >= 4) {
        // "weight" — discount and chalk are direct %; crit gets a 1.5× weight
        // (matches valueMult above) so it isn't unfairly dropped.
        const weight = (k: typeof effects[number]) => next[k] * (k === "critPct" ? 1.5 : 1);
        const drop = active.slice().sort((a, b) => weight(a) - weight(b))[0];
        next[drop] = 0;
        const keep = active.filter(k => k !== drop);
        for (const k of keep) next[k] = Math.max(1, Math.round(next[k] * (4 / 3)));
      }
    }
    // No useless items: if every effect rounded to 0, give a small chalk/boss/crit floor.
    if (next.bonusPct === 0 && next.discountPct === 0 && next.critPct === 0 && next.bossPct === 0) {
      const floor = item.rarity === "legendary" ? 5 : item.rarity === "epic" ? 3 : item.rarity === "rare" ? 2 : 1;
      if (effectAllowed(item.group, item.rarity, "chalk")) next.bonusPct = floor;
      else if (effectAllowed(item.group, item.rarity, "boss")) next.bossPct = floor;
      else if (effectAllowed(item.group, item.rarity, "crit")) next.critPct = floor;
      else if (effectAllowed(item.group, item.rarity, "discount")) next.discountPct = floor;
      else next.bonusPct = floor; // last-ditch: low rarity gear has no allowed effect — give it chalk anyway
    }
    const now = { price: item.price, bonusPct: nowBonus, discountPct: nowDisc, critPct: nowCrit, bossPct: nowBoss, levelReq: nowLvl };
    const changed =
      next.price !== now.price ||
      next.bonusPct !== now.bonusPct ||
      next.discountPct !== now.discountPct ||
      next.critPct !== now.critPct ||
      next.bossPct !== now.bossPct ||
      next.levelReq !== now.levelReq;
    return { item, now, next, changed };
  });

  const activities: ActivityDiff[] = (Object.keys(BASE_CHALK) as ActivityType[]).map(a => {
    const now = currentRewards[a] ?? BASE_CHALK[a];
    const next = TARGET_ACTIVITY[a];
    return { activity: a, now, next, changed: now !== next };
  });

  return { items: itemDiffs, activities };
}
