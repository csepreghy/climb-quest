// ClimbQuest game data: levels, items, badges, boss templates

export type Rarity = "common" | "rare" | "epic" | "legendary";
export type Slot = "shoes" | "chalk" | "outfit" | "bottoms" | "hat" | "hand" | "accessory" | "study" | "aura" | "title";
export type ItemGroup = "outfit" | "gear" | "power";

/** Slots that belong to the "gear" group, in display/unlock order. */
export const GEAR_SLOTS: Slot[] = ["chalk", "accessory", "study"];

/** How many gear slots are unlocked at a given player level (max 4). */
export function gearSlotsUnlocked(level: number): number {
  if (level >= 8) return 4;
  if (level >= 5) return 3;
  if (level >= 3) return 2;
  return 1;
}
export type Gender = "male" | "female";

export type ActivityType =
  | "warmup_boulder"
  | "boulder"
  | "hard_boulder"
  | "boulder_send"
  | "boss_attempt"
  | "boss_send";

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
  { level: 1, title: "Rental Shoe Rookie", cost: 0,     emoji: "🥾", desc: "Oversized rentals, max enthusiasm.",            unlocks: ["Starter avatar", "Rental shoes", "Plain chalk bag"] },
  { level: 2, title: "Chalk Chaser",       cost: 200,   emoji: "💨", desc: "Obsessed with chalk. Still figuring it out.",   unlocks: ["Chalk bag skin", "Beanie", "First Send badge"] },
  { level: 3, title: "Footwork Fiend",     cost: 500,   emoji: "👣", desc: "Discovers feet exist. Game-changing.",          unlocks: ["Footwork badge", "Cleaner shoes", "Technique fit"] },
  { level: 4, title: "Jug Juggler",        cost: 1100,  emoji: "🤹", desc: "Big holds, big confidence, slightly chaotic.",  unlocks: ["Chalk bucket", "Funny socks", "+1 Gear slot"] },
  { level: 5, title: "Cute Crimper",       cost: 2200,  emoji: "🤏", desc: "Tiny holds = personality trait.",               unlocks: ["Magdust", "Wristband", "+1 Power-up slot"] },
  { level: 6, title: "Dyno Devourer",      cost: 4200,  emoji: "🦘", desc: "Full commitment. No fear. Only flight.",        unlocks: ["Neon pants", "Neon chalk bag", "No Static badge"] },
  { level: 7, title: "Board Goblin",       cost: 7800,  emoji: "👺", desc: "Lives on the board. Slightly feral.",           unlocks: ["Board shoes", "Tape pack", "+1 Gear slot"] },
  { level: 8, title: "Beta Breaker",       cost: 14000, emoji: "🧠", desc: "Reads sequences. Solves cruxes. Smug.",         unlocks: ["Beta notebook", "Smart glasses", "Sequence Master"] },
  { level: 9, title: "Project Beast",      cost: 24000, emoji: "🦍", desc: "Long-term projects only. Locked in.",           unlocks: ["Project Beast Fit", "Premium brush", "Elite hoodie"] },
  { level: 10,title: "Crimp Demigod",      cost: 40000, emoji: "👑", desc: "Endgame. Cute. Terrifying. Glowing.",           unlocks: ["Minimal Send Kit", "Golden Crocs", "+1 Gear slot", "+1 Power-up slot"] },
];

export interface ShopItem {
  id: string;
  name: string;
  group: ItemGroup;          // outfit | gear | power
  category: "Top" | "Pants" | "Shoes" | "Hat" | "Hand" | "Brushes" | "Chalk" | "Study" | "Accessories" | "Auras" | "Titles" | "Consumables";
  slot: Slot;
  rarity: Rarity;
  price: number;
  emoji: string;
  desc: string;
  /** Multiplier on Chalk earned. e.g. 0.03 = +3% */
  bonus?: { mult: number; appliesTo?: ActivityType[] | "all"; styleMatch?: Style[] };
  /** Consumable: one-time bonus on next log */
  consumableBonus?: number;
  levelReq?: number;
}

export const SHOP: ShopItem[] = [];

export const ITEM_BY_ID: Record<string, ShopItem> = Object.fromEntries(SHOP.map(i => [i.id, i]));

export interface BadgeDef {
  id: string; name: string; emoji: string; desc: string;
}
export const BADGES: BadgeDef[] = [
  { id: "first_send",        name: "First Send",        emoji: "🎉", desc: "Sent your first boulder." },
  { id: "first_flash",       name: "First Flash",       emoji: "⚡", desc: "Flashed a boulder first try." },
  { id: "chalk_monster",     name: "Chalk Monster",     emoji: "👹", desc: "Earned 1,000 Chalk total." },
  { id: "slab_survivor",     name: "Slab Survivor",     emoji: "🧗", desc: "Logged a slab problem." },
  { id: "overhang_enjoyer",  name: "Overhang Enjoyer",  emoji: "🙃", desc: "Logged an overhang problem." },
  { id: "board_goblin_cert", name: "Board Goblin Certified", emoji: "👺", desc: "Logged 3 board sessions." },
  { id: "crux_breaker",      name: "Crux Breaker",      emoji: "🔓", desc: "Sent a boss project." },
  { id: "project_slayer",    name: "Project Slayer",    emoji: "⚔️", desc: "Sent 3 boss projects." },
  { id: "crocs_equipped",    name: "Crocs Equipped",    emoji: "🩴", desc: "Equipped Crocs." },
  { id: "golden_crocs",      name: "Golden Crocs Owner",emoji: "👑", desc: "Owned the Golden Crocs." },
  { id: "shirtless_form",    name: "Shirtless Final Form", emoji: "🦾", desc: "Equipped Minimal Send Kit." },
  { id: "minimal_kit",       name: "Minimal Send Kit Equipped", emoji: "✨", desc: "Maximum send energy." },
  { id: "dyno_unlocked",     name: "Dyno Devourer Unlocked", emoji: "🦘", desc: "Reached level 6." },
  { id: "demigod_unlocked",  name: "Crimp Demigod Unlocked", emoji: "👑", desc: "Reached level 10." },
  { id: "got_humbled",       name: "Got Humbled",       emoji: "🥲", desc: "Logged a 'got humbled' result." },
  { id: "zone_reached",      name: "Zone Reached",      emoji: "🎯", desc: "Reached the zone on a boss project." },
  { id: "tiny_crimp",        name: "Tiny Crimp Survivor", emoji: "🤏", desc: "Logged 5 crimp problems." },
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
  warmup_boulder: 30,
  boulder: 80,
  hard_boulder: 160,
  boulder_send: 60,
  boss_attempt: 50,
  boss_send: 250,
};

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  warmup_boulder: "Warm-up Boulder",
  boulder: "Regular Boulder",
  hard_boulder: "Hard Boulder",
  boulder_send: "Boulder Send",
  boss_attempt: "Boss Project Attempt",
  boss_send: "Boss Project Send",
};

export const STYLES: Style[] = ["slab","vertical","overhang","cave","compression","coordination","dyno","mantle","crimp","sloper"];

export const RARITY_COLOR: Record<Rarity, string> = {
  common: "text-common border-common/40",
  rare: "text-rare border-rare/50",
  epic: "text-epic border-epic/60",
  legendary: "text-legendary border-legendary/60",
  
};

// Border ring color around an item's image, by rarity.
export const RARITY_BORDER: Record<Rarity, string> = {
  common: "ring-2 ring-white/80",
  rare: "ring-2 ring-rare",
  epic: "ring-2 ring-epic",
  legendary: "ring-2 ring-legendary",
  
};
