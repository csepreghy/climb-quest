// ClimbQuest game data: levels, items, badges, boss templates

export type Rarity = "common" | "rare" | "legendary" | "consumable";
export type Slot = "shoes" | "chalk" | "outfit" | "bottoms" | "accessory" | "aura" | "title";
export type Gender = "male" | "female" | "neutral";

export type ActivityType = "boulder" | "boss_attempt" | "boss_send";

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
  { level: 1, title: "Rental Shoe Rookie", cost: 0,    emoji: "🥾", desc: "Oversized rentals, max enthusiasm.",            unlocks: ["Starter avatar", "Rental shoes", "Plain chalk bag"] },
  { level: 2, title: "Chalk Chaser",       cost: 150,  emoji: "💨", desc: "Obsessed with chalk. Still figuring it out.",   unlocks: ["Chalk bag skin", "Beanie", "First Send badge"] },
  { level: 3, title: "Footwork Fiend",     cost: 350,  emoji: "👣", desc: "Discovers feet exist. Game-changing.",          unlocks: ["Footwork badge", "Cleaner shoes", "Technique fit"] },
  { level: 4, title: "Jug Juggler",        cost: 700,  emoji: "🤹", desc: "Big holds, big confidence, slightly chaotic.",  unlocks: ["Chalk bucket", "Funny socks", "Chunky shorts"] },
  { level: 5, title: "Cute Crimper",       cost: 1200, emoji: "🤏", desc: "Tiny holds = personality trait.",               unlocks: ["Magdust", "Wristband", "Compact holster"] },
  { level: 6, title: "Dyno Devourer",      cost: 1900, emoji: "🦘", desc: "Full commitment. No fear. Only flight.",        unlocks: ["Neon pants", "Neon chalk bag", "No Static badge"] },
  { level: 7, title: "Board Goblin",       cost: 2800, emoji: "👺", desc: "Lives on the board. Slightly feral.",           unlocks: ["Board shoes", "Tape pack", "Goblin title", "Board aura"] },
  { level: 8, title: "Beta Breaker",       cost: 4000, emoji: "🧠", desc: "Reads sequences. Solves cruxes. Smug.",         unlocks: ["Beta notebook", "Smart glasses", "Sequence Master"] },
  { level: 9, title: "Project Beast",      cost: 5500, emoji: "🦍", desc: "Long-term projects only. Locked in.",           unlocks: ["Project Beast Fit", "Premium brush", "Elite hoodie"] },
  { level: 10,title: "Crimp Demigod",      cost: 7500, emoji: "👑", desc: "Endgame. Cute. Terrifying. Glowing.",           unlocks: ["Minimal Send Kit", "Golden Crocs", "Cosmic Magdust", "Legendary aura"] },
];

export interface ShopItem {
  id: string;
  name: string;
  category: "Shoes" | "Chalk" | "Outfits" | "Brushes" | "Accessories" | "Auras" | "Titles" | "Consumables";
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

export const SHOP: ShopItem[] = [
  // Shoes
  { id: "rental_shoes",   name: "Rental Shoes",        category: "Shoes",    slot: "shoes", rarity: "common",    price: 0,    emoji: "🥾", desc: "Smell included. Free with starter pack.", bonus: { mult: 0.00, appliesTo: "all" } },
  { id: "aggressive",     name: "Aggressive Shoes",    category: "Shoes",    slot: "shoes", rarity: "rare",      price: 600,  emoji: "👟", desc: "+3% Chalk on every boulder logged.", bonus: { mult: 0.03, appliesTo: ["boulder"] } },
  { id: "soft_comp",      name: "Soft Comp Shoes",     category: "Shoes",    slot: "shoes", rarity: "rare",      price: 750,  emoji: "🩰", desc: "+3% Chalk on coordination & dyno problems.", bonus: { mult: 0.03, styleMatch: ["coordination","dyno"] } },
  { id: "board_shoes",    name: "Board Shoes",         category: "Shoes",    slot: "shoes", rarity: "rare",      price: 800,  emoji: "🥿", desc: "+3% Chalk on every boulder.", bonus: { mult: 0.03, appliesTo: ["boulder"] }, levelReq: 5 },

  // Chalk
  { id: "plain_chalk",    name: "Plain Chalk Bag",     category: "Chalk",    slot: "chalk", rarity: "common",    price: 0,    emoji: "🎒", desc: "Holds chalk. Revolutionary.", bonus: { mult: 0.00, appliesTo: "all" } },
  { id: "chalk_bucket",   name: "Chalk Bucket",        category: "Chalk",    slot: "chalk", rarity: "common",    price: 200,  emoji: "🪣", desc: "+1% Chalk on every boulder.", bonus: { mult: 0.01, appliesTo: ["boulder"] } },
  { id: "liquid_chalk",   name: "Liquid Chalk",        category: "Chalk",    slot: "chalk", rarity: "rare",      price: 500,  emoji: "🧪", desc: "+2% Chalk from all logs.", bonus: { mult: 0.02, appliesTo: "all" } },
  { id: "magdust",        name: "Magdust",             category: "Chalk",    slot: "chalk", rarity: "rare",      price: 900,  emoji: "✨", desc: "+3% Chalk from all logs.", bonus: { mult: 0.03, appliesTo: "all" }, levelReq: 5 },
  { id: "cosmic_magdust", name: "Cosmic Magdust",      category: "Chalk",    slot: "chalk", rarity: "legendary", price: 2500, emoji: "🌌", desc: "+6% Chalk from all logs. Glows.", bonus: { mult: 0.06, appliesTo: "all" }, levelReq: 9 },

  // Outfits / tops
  { id: "beanie",         name: "Lucky Beanie",        category: "Outfits",  slot: "outfit",rarity: "common",    price: 150,  emoji: "🧢", desc: "+1% Chalk. Slightly itchy.", bonus: { mult: 0.01, appliesTo: "all" } },
  { id: "hoodie",         name: "Project Hoodie",      category: "Outfits",  slot: "outfit",rarity: "rare",      price: 700,  emoji: "👕", desc: "+2% Chalk on boss attempts.", bonus: { mult: 0.02, appliesTo: ["boss_attempt"] } },
  { id: "minimal_kit",    name: "Minimal Send Kit",    category: "Outfits",  slot: "outfit",rarity: "legendary", price: 2000, emoji: "🦾", desc: "+5% Chalk on boss sends.", bonus: { mult: 0.05, appliesTo: ["boss_send"] }, levelReq: 10 },
  { id: "summer_fit",     name: "Summer Gym Fit",      category: "Outfits",  slot: "outfit",rarity: "rare",      price: 600,  emoji: "🩳", desc: "+2% Chalk on every boulder.", bonus: { mult: 0.02, appliesTo: ["boulder"] } },
  { id: "project_beast",  name: "Project Beast Fit",   category: "Outfits",  slot: "outfit",rarity: "legendary", price: 1800, emoji: "🦍", desc: "+5% Chalk on boss attempts & sends.", bonus: { mult: 0.05, appliesTo: ["boss_attempt","boss_send"] }, levelReq: 9 },

  // Bottoms
  { id: "chunky_shorts",  name: "Chunky Shorts",       category: "Outfits",  slot: "bottoms", rarity: "common",  price: 250,  emoji: "🩳", desc: "+1% Chalk. Pockets full of crumbs.", bonus: { mult: 0.01, appliesTo: "all" } },
  { id: "mammut_pants",   name: "Bouldering Pants",    category: "Outfits",  slot: "bottoms", rarity: "rare",    price: 800,  emoji: "👖", desc: "+2% Chalk on every boulder.", bonus: { mult: 0.02, appliesTo: ["boulder"] } },
  { id: "neon_pants",     name: "Neon Send Pants",     category: "Outfits",  slot: "bottoms", rarity: "rare",    price: 950,  emoji: "🌈", desc: "+3% Chalk on dyno-style problems.", bonus: { mult: 0.03, styleMatch: ["dyno"] }, levelReq: 6 },

  // Brushes / accessories
  { id: "boar_brush",     name: "Boar Hair Brush",     category: "Brushes",  slot: "accessory", rarity: "common", price: 180, emoji: "🖌️", desc: "+1% Chalk on every boulder.", bonus: { mult: 0.01, appliesTo: ["boulder"] } },
  { id: "premium_brush",  name: "Premium Brush",       category: "Brushes",  slot: "accessory", rarity: "rare",   price: 700, emoji: "🪮", desc: "+2% Chalk on boss attempts.", bonus: { mult: 0.02, appliesTo: ["boss_attempt","boss_send"] } },
  { id: "finger_tape",    name: "Finger Tape",         category: "Accessories", slot: "accessory", rarity: "common", price: 200, emoji: "🩹", desc: "+2% Chalk on crimp-style problems.", bonus: { mult: 0.02, styleMatch: ["crimp"] } },
  { id: "lucky_socks",    name: "Lucky Socks",         category: "Accessories", slot: "accessory", rarity: "common", price: 220, emoji: "🧦", desc: "+1% Chalk on boss sends.", bonus: { mult: 0.01, appliesTo: ["boss_send"] } },
  { id: "crocs",          name: "Crocs",               category: "Accessories", slot: "accessory", rarity: "rare",   price: 800, emoji: "🩴", desc: "+2% Chalk on every boulder.", bonus: { mult: 0.02, appliesTo: ["boulder"] } },
  { id: "golden_crocs",   name: "Golden Crocs",        category: "Accessories", slot: "accessory", rarity: "legendary", price: 2200, emoji: "👑", desc: "+5% Chalk on ALL logs.", bonus: { mult: 0.05, appliesTo: "all" }, levelReq: 10 },

  // Auras
  { id: "chalk_cloud",    name: "Chalk Cloud Aura",    category: "Auras",    slot: "aura", rarity: "rare",      price: 1100, emoji: "☁️", desc: "+2% Chalk from everything. Mystical.", bonus: { mult: 0.02, appliesTo: "all" } },
  { id: "board_aura",     name: "Board Goblin Aura",   category: "Auras",    slot: "aura", rarity: "rare",      price: 1300, emoji: "👹", desc: "+3% Chalk on every boulder.", bonus: { mult: 0.03, appliesTo: ["boulder"] }, levelReq: 7 },
  { id: "crimp_demon",    name: "Crimp Demon Aura",    category: "Auras",    slot: "aura", rarity: "legendary", price: 2400, emoji: "😈", desc: "+5% Chalk on crimp-style problems.", bonus: { mult: 0.05, styleMatch: ["crimp"] }, levelReq: 10 },

  // Titles
  { id: "title_goblin",   name: "Title: Board Goblin", category: "Titles",   slot: "title", rarity: "rare",     price: 600,  emoji: "🏷️", desc: "Wear it with pride.", levelReq: 7 },
  { id: "title_humbled",  name: "Title: Got Humbled",  category: "Titles",   slot: "title", rarity: "common",   price: 250,  emoji: "🥲", desc: "We've all been there." },
  { id: "title_chalk_monster", name: "Title: Chalk Monster", category: "Titles", slot: "title", rarity: "rare", price: 700, emoji: "👹", desc: "Coats every hold." },
  { id: "title_demigod",  name: "Title: Crimp Demigod",category: "Titles",   slot: "title", rarity: "legendary",price: 1800, emoji: "👑", desc: "Endgame energy.", levelReq: 10 },

  // Consumables
  { id: "energy_gummies", name: "Send Gummies",        category: "Consumables", slot: "accessory", rarity: "consumable", price: 120, emoji: "🍬", desc: "+15% Chalk on your NEXT logged activity.", consumableBonus: 0.15 },
  { id: "espresso",       name: "Pre-Send Espresso",   category: "Consumables", slot: "accessory", rarity: "consumable", price: 200, emoji: "☕", desc: "+25% Chalk on your NEXT logged activity.", consumableBonus: 0.25 },
];

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
  { id: "crux_breaker",      name: "Crux Breaker",      emoji: "🔓", desc: "Sent a boss problem." },
  { id: "project_slayer",    name: "Project Slayer",    emoji: "⚔️", desc: "Sent 3 boss problems." },
  { id: "crocs_equipped",    name: "Crocs Equipped",    emoji: "🩴", desc: "Equipped Crocs." },
  { id: "golden_crocs",      name: "Golden Crocs Owner",emoji: "👑", desc: "Owned the Golden Crocs." },
  { id: "shirtless_form",    name: "Shirtless Final Form", emoji: "🦾", desc: "Equipped Minimal Send Kit." },
  { id: "minimal_kit",       name: "Minimal Send Kit Equipped", emoji: "✨", desc: "Maximum send energy." },
  { id: "dyno_unlocked",     name: "Dyno Devourer Unlocked", emoji: "🦘", desc: "Reached level 6." },
  { id: "demigod_unlocked",  name: "Crimp Demigod Unlocked", emoji: "👑", desc: "Reached level 10." },
  { id: "got_humbled",       name: "Got Humbled",       emoji: "🥲", desc: "Logged a 'got humbled' result." },
  { id: "zone_reached",      name: "Zone Reached",      emoji: "🎯", desc: "Reached the zone on a boss problem." },
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
  boulder: 80,
  boss_attempt: 50,
  boss_send: 250,
};

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  boulder: "Boulder",
  boss_attempt: "Boss Problem Attempt",
  boss_send: "Boss Problem Send",
};

export const STYLES: Style[] = ["slab","vertical","overhang","cave","compression","coordination","dyno","mantle","crimp","sloper"];

export const RARITY_COLOR: Record<Rarity, string> = {
  common: "text-common border-common/40",
  rare: "text-rare border-rare/50",
  legendary: "text-legendary border-legendary/60",
  consumable: "text-chalk-glow border-chalk-glow/40",
};
