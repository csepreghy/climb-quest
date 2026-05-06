// Admin-managed custom shop items, persisted in localStorage.
// Custom items live alongside the built-in SHOP catalog and are merged
// into all reads via getItem / getAllItems / useShopItems.
import { useSyncExternalStore } from "react";
import { ShopItem, SHOP, ITEM_BY_ID, Rarity, ItemGroup, Slot, ActivityType } from "./data";

const KEY = "climbquest:customItems:v1";

interface Registry {
  custom: ShopItem[];
}

function load(): Registry {
  if (typeof window === "undefined") return { custom: [] };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { custom: [] };
    return JSON.parse(raw) as Registry;
  } catch { return { custom: [] }; }
}

let state: Registry = load();
const listeners = new Set<() => void>();
function persist() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} }
function set(u: (s: Registry) => Registry) { state = u(state); persist(); listeners.forEach(l => l()); }

export function useCustomItems(): ShopItem[] {
  return useSyncExternalStore(
    cb => { listeners.add(cb); return () => listeners.delete(cb); },
    () => state.custom,
    () => state.custom,
  );
}

/** Get any item by id (built-in OR custom) */
export function getItem(id: string): ShopItem | undefined {
  return ITEM_BY_ID[id] ?? state.custom.find(i => i.id === id);
}

/** Full merged catalog */
export function getAllItems(): ShopItem[] {
  return [...SHOP, ...state.custom];
}

export function useAllItems(): ShopItem[] {
  const custom = useCustomItems();
  return [...SHOP, ...custom];
}

const id = () => "custom_" + Math.random().toString(36).slice(2, 9);

export interface CustomItemInput {
  name: string;
  group: ItemGroup;
  category: ShopItem["category"];
  slot: Slot;
  rarity: Rarity;
  price: number;
  imageDataUrl?: string;        // stored on .emoji as data URL OR as image
  bonusPct: number;             // % chalk bonus, e.g. 3 → 0.03
  appliesTo?: ActivityType[] | "all";
}

export function addCustomItem(input: CustomItemInput): ShopItem {
  const item: ShopItem = {
    id: id(),
    name: input.name,
    group: input.group,
    category: input.category,
    slot: input.slot,
    rarity: input.rarity,
    price: input.price,
    emoji: input.imageDataUrl ?? "🎁",
    desc: input.bonusPct > 0 ? `+${input.bonusPct}% Chalk.` : "Custom item.",
    bonus: input.bonusPct > 0 ? { mult: input.bonusPct / 100, appliesTo: input.appliesTo ?? "all" } : undefined,
  };
  set(s => ({ custom: [...s.custom, item] }));
  return item;
}

export function updateCustomItem(itemId: string, patch: Partial<CustomItemInput>) {
  set(s => ({
    custom: s.custom.map(it => {
      if (it.id !== itemId) return it;
      const next: ShopItem = { ...it };
      if (patch.name !== undefined) next.name = patch.name;
      if (patch.group !== undefined) next.group = patch.group;
      if (patch.category !== undefined) next.category = patch.category;
      if (patch.slot !== undefined) next.slot = patch.slot;
      if (patch.rarity !== undefined) next.rarity = patch.rarity;
      if (patch.price !== undefined) next.price = patch.price;
      if (patch.imageDataUrl !== undefined) next.emoji = patch.imageDataUrl;
      if (patch.bonusPct !== undefined) {
        next.bonus = patch.bonusPct > 0
          ? { mult: patch.bonusPct / 100, appliesTo: patch.appliesTo ?? next.bonus?.appliesTo ?? "all" }
          : undefined;
        next.desc = patch.bonusPct > 0 ? `+${patch.bonusPct}% Chalk.` : next.desc;
      } else if (patch.appliesTo !== undefined && next.bonus) {
        next.bonus = { ...next.bonus, appliesTo: patch.appliesTo };
      }
      return next;
    }),
  }));
}

export function deleteCustomItem(itemId: string) {
  set(s => ({ custom: s.custom.filter(it => it.id !== itemId) }));
}

/** Heuristic: an "emoji" that's actually a data URL/image */
export function isImageEmoji(v: string | undefined): boolean {
  return !!v && (v.startsWith("data:") || v.startsWith("http") || v.startsWith("/"));
}
