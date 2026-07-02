import shopaholicAsset from "@/assets/badges/shopaholic.png.asset.json";
// ClimbQuest game data: levels, items, badges, boss templates


export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";
export type Slot = "shoes" | "chalk" | "outfit" | "bottoms" | "hat" | "hand" | "accessory" | "study" | "aura" | "title" | "powerup" | "buddy" | "board";
export type ItemGroup = "outfit" | "gear" | "power" | "buddy" | "board";

/** Player level required before the Climbing Buddy slot unlocks. */
export const BUDDY_SLOT_UNLOCK_LEVEL = 1;

export type EffectKey = "chalk" | "crit" | "boss" | "board" | "discount";

/** Single source of truth for which effects an item may carry, by group + rarity.
 *  - chalk    → outfit, power-ups, board (any rarity)
 *  - discount → power-ups, board (any rarity)
 *  - crit     → any group, epic+ only (deterministic crit-vs-boss split per slot at epic; both at legendary)
 *  - boss     → any group, epic+ only
 *  - board    → any group, epic+ only (mirrors boss). Applies only to board climbing.
 */
export function effectAllowed(group: ItemGroup, rarity: Rarity, effect: EffectKey): boolean {
  // Climbing buddies carry a chalk bonus (default 50%, admin-editable). Other perks land later.
  const epicPlus = rarity === "epic" || rarity === "legendary" || rarity === "mythic";
  if (group === "buddy") return effect === "chalk";
  if (group === "board") return true; // board items support all five effects
  switch (effect) {
    case "chalk":    return group === "outfit" || group === "power";
    case "discount": return group === "power";
    // Gear is the home of crit/boss/board at every rarity; other groups only at epic+.
    case "crit":     return group === "gear" || epicPlus;
    case "boss":     return group === "gear" || epicPlus;
    case "board":    return group === "gear" || epicPlus;
  }
}

/** Slots that belong to the "gear" group, in display/unlock order. */
export const GEAR_SLOTS: Slot[] = ["chalk", "accessory", "study"];

/** All gear slots are always available — level gating has been removed. */
export function gearSlotsUnlocked(_level: number): number {
  return 4;
}
export type Gender = "male" | "female";

export type ActivityType =
  | "warmup_boulder"
  | "boulder"
  | "hard_boulder"
  | "project_boulder"
  | "boulder_send"
  | "boss_attempt"
  | "boss_send"
  | "strength_rep"
  | "strength_boss_send";

export type Style =
  | "slab" | "vertical" | "overhang" | "cave" | "compression"
  | "coordination" | "dyno" | "mantle" | "crimp" | "sloper";

export interface ClimberLevel {
  level: number;
  title: string;
  cost: number;
  emoji: string;
  desc: string;
  unlocks: string[];
}

export const LEVELS: ClimberLevel[] = [
  { level: 1, title: "Rental Shoe Rookie", cost: 0,        emoji: "🥾", desc: "Oversized rentals, max enthusiasm.",            unlocks: ["Starter avatar", "Rental shoes", "Plain chalk bag", "1 Gear slot"] },
  { level: 2, title: "Chalk Chaser",       cost: 100,      emoji: "💨", desc: "Obsessed with chalk. Still figuring it out.",   unlocks: ["Chalk bag skin", "Beanie"] },
  { level: 3, title: "Footwork Fiend",     cost: 300,      emoji: "👣", desc: "Discovers feet exist. Game-changing.",          unlocks: ["Cleaner shoes", "+1 Gear slot"] },
  { level: 4, title: "Jug Juggler",        cost: 800,      emoji: "🤹", desc: "Big holds, big confidence, slightly chaotic.",  unlocks: ["Chalk bucket", "Funny socks"] },
  { level: 5, title: "Cute Crimper",       cost: 2000,     emoji: "🤏", desc: "Tiny holds = personality trait.",               unlocks: ["Magdust", "Wristband", "+1 Gear slot", "+1 Power-up slot"] },
  { level: 6, title: "Dyno Devourer",      cost: 5000,     emoji: "🦘", desc: "Full commitment. No fear. Only flight.",        unlocks: ["Neon pants", "Neon chalk bag"] },
  { level: 7, title: "Board Goblin",       cost: 15000,    emoji: "👺", desc: "Lives on the board. Slightly feral.",           unlocks: ["Board shoes", "Tape pack"] },
  { level: 8, title: "Beta Breaker",       cost: 50000,    emoji: "🧠", desc: "Reads sequences. Solves cruxes. Smug.",         unlocks: ["Beta notebook", "Smart glasses", "+1 Gear slot (max)", "Sequence Master"] },
  { level: 9, title: "Project Beast",      cost: 200000,   emoji: "🦍", desc: "Long-term projects only. Locked in.",           unlocks: ["Project Beast Fit", "Premium brush", "Elite hoodie"] },
  { level: 10,title: "Crimp Demigod",      cost: 1000000,  emoji: "👑", desc: "Endgame. Cute. Terrifying. Glowing.",           unlocks: ["Minimal Send Kit", "Golden Crocs", "+1 Power-up slot"] },
];

export interface ShopItem {
  id: string;
  name: string;
  group: ItemGroup;          // outfit | gear | power
  category: "Top" | "Pants" | "Shoes" | "Hat" | "Hand" | "Brushes" | "Chalk" | "Study" | "Power-up" | "Accessories" | "Auras" | "Titles" | "Consumables" | "Buddy" | "Board";
  slot: Slot;
  rarity: Rarity;
  price: number;
  emoji: string;
  desc: string;
  /** Multiplier on Chalk earned. e.g. 0.03 = +3% */
  bonus?: { mult: number; appliesTo?: ActivityType[] | "all"; styleMatch?: Style[] };
  /** Consumable: one-time bonus on next log */
  consumableBonus?: number;
  /** % chance an entire log's chalk gets doubled (0-100). Stacks across items via 1 - Π(1 - p). */
  critChancePct?: number;
  /** Extra % chalk on boss_attempt and boss_send activities (separate from `bonus`). */
  bossBonusPct?: number;
  /** Extra % chalk on board sessions only. Sums across equipped items. */
  boardBonusPct?: number;
  levelReq?: number;
  /** Multiplier on shop prices when equipped, e.g. 0.9 = 10% off. Defaults to 1. */
  priceMult?: number;
  /** Gender restriction for Tops/Pants. 'unisex' (or undefined) shows for everyone. */
  gender?: "male" | "female" | "unisex";
}

export const SHOP: ShopItem[] = [];

export const ITEM_BY_ID: Record<string, ShopItem> = Object.fromEntries(SHOP.map(i => [i.id, i]));

export interface BadgeDef {
  id: string; name: string; image: string; desc: string; rarity?: Rarity;
}
export const BADGES: BadgeDef[] = [
  { id: "shopaholic", name: "Shopaholic", image: shopaholicAsset.url, desc: "Bought 10 shop items.", rarity: "epic" },
];

export const BADGE_BY_ID: Record<string, BadgeDef> = Object.fromEntries(BADGES.map(b => [b.id, b]));

export interface BossTemplate {
  id: string; name: string; grade: string; style: Style; difficulty: number; emoji: string; flavor: string;
}
export const BOSS_TEMPLATES: BossTemplate[] = [
  { id: "v5_slab",       name: "V5 Slab Menace",        grade: "V5",  style: "slab",        difficulty: 5,  emoji: "🗿", flavor: "Smiles while you fall." },
  { id: "6bplus_over",   name: "6B+ Overhang Goblin",   grade: "6B+", style: "overhang",    difficulty: 6,  emoji: "👺", flavor: "Pumpy. Petty. Personal." },
  { id: "moonboard_dem", name: "MoonBoard Benchmark Demon", grade: "V7", style: "crimp",    difficulty: 8,  emoji: "😈", flavor: "Lives in the 40°." },
  { id: "coord_paddle",  name: "Coordination Paddle Dyno", grade: "V6", style: "coordination", difficulty: 7, emoji: "🌀", flavor: "Slap, slap, fall." },
  { id: "comp_cave",     name: "Compression Cave Beast", grade: "V8", style: "compression", difficulty: 9,  emoji: "🐻", flavor: "Squeeze or be squeezed." },
  { id: "tiny_crimp",    name: "Tiny Crimp Nightmare",  grade: "V9",  style: "crimp",       difficulty: 10, emoji: "👻", flavor: "Your tendons will write a letter." },
];

// Base Chalk per activity (before bonuses)
export const BASE_CHALK: Record<ActivityType, number> = {
  warmup_boulder: 25,
  boulder: 70,
  hard_boulder: 150,
  project_boulder: 250,
  boulder_send: 50,
  boss_attempt: 60,
  boss_send: 400,
  strength_rep: 5,
  strength_boss_send: 300,
};

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  warmup_boulder: "Warm-up Boulder",
  boulder: "Regular Boulder",
  hard_boulder: "Hard Boulder",
  project_boulder: "Project Boulder",
  boulder_send: "Boulder Send",
  boss_attempt: "Boss Project Attempt",
  boss_send: "Boss Project Send",
  strength_rep: "Strength · per rep",
  strength_boss_send: "Strength Boss Defeated",
};

export const STYLES: Style[] = ["slab","vertical","overhang","cave","compression","coordination","dyno","mantle","crimp","sloper"];

export const RARITY_COLOR: Record<Rarity, string> = {
  common: "text-common border-common/40",
  uncommon: "text-uncommon border-uncommon/50",
  rare: "text-rare border-rare/50",
  epic: "text-epic border-epic/60",
  legendary: "text-legendary border-legendary/60",
  mythic: "text-mythic border-mythic/60",
};

// Border ring color around an item's image, by rarity.
export const RARITY_BORDER: Record<Rarity, string> = {
  common: "ring-2 ring-white/80",
  uncommon: "ring-2 ring-uncommon",
  rare: "ring-2 ring-rare",
  epic: "ring-2 ring-epic",
  legendary: "ring-2 ring-legendary",
  mythic: "ring-2 ring-mythic",
};
