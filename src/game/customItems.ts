// Admin-managed shared shop items, persisted in Supabase.
// Custom items + hidden built-in ids live in two backend tables and are
// synced realtime to every user's client.
import { useSyncExternalStore, useEffect } from "react";
import { ShopItem, SHOP, ITEM_BY_ID, Rarity, ItemGroup, Slot, ActivityType } from "./data";
import { supabase } from "@/integrations/supabase/client";

interface State {
  custom: ShopItem[];
  hidden: Set<string>;
  loaded: boolean;
}

let state: State = { custom: [], hidden: new Set(), loaded: false };
const listeners = new Set<() => void>();
function emit() { listeners.forEach(l => l()); }
function setState(u: (s: State) => State) { state = u(state); emit(); }

function rowToItem(r: any): ShopItem {
  const bonusPct = Number(r.bonus_pct ?? 0);
  return {
    id: r.id,
    name: r.name,
    group: r.group as ItemGroup,
    category: r.category as ShopItem["category"],
    slot: r.slot as Slot,
    rarity: r.rarity as Rarity,
    price: r.price ?? 0,
    emoji: r.image ?? "🎁",
    desc: "",
    bonus: bonusPct > 0
      ? { mult: bonusPct / 100, appliesTo: (r.applies_to ?? "all") as ActivityType[] | "all" }
      : undefined,
  };
}

async function refresh() {
  const [items, hidden] = await Promise.all([
    supabase.from("shop_items").select("*").order("created_at", { ascending: true }),
    supabase.from("hidden_builtin_items").select("item_id"),
  ]);
  setState(() => ({
    custom: (items.data ?? []).map(rowToItem),
    hidden: new Set((hidden.data ?? []).map((r: any) => r.item_id as string)),
    loaded: true,
  }));
}

let initialized = false;
function ensureInit() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  refresh();
  const channel = supabase.channel("shop-items-sync-" + Math.random().toString(36).slice(2, 8));
  channel
    .on("postgres_changes", { event: "*", schema: "public", table: "shop_items" }, () => refresh())
    .on("postgres_changes", { event: "*", schema: "public", table: "hidden_builtin_items" }, () => refresh())
    .subscribe();
}

function subscribe(cb: () => void) {
  ensureInit();
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

export function useCustomItems(): ShopItem[] {
  return useSyncExternalStore(subscribe, () => state.custom, () => state.custom);
}

export function useHiddenBuiltins(): Set<string> {
  return useSyncExternalStore(subscribe, () => state.hidden, () => state.hidden);
}

/** Get any item by id (built-in OR custom). Hidden built-ins still resolve so owned items render. */
export function getItem(id: string): ShopItem | undefined {
  return ITEM_BY_ID[id] ?? state.custom.find(i => i.id === id);
}

/** Full catalog: only admin-managed items. Built-ins are no longer surfaced. */
export function getAllItems(): ShopItem[] {
  return [...state.custom];
}

export function useAllItems(): ShopItem[] {
  // re-render on any change
  useSyncExternalStore(subscribe, () => state, () => state);
  return getAllItems();
}

const newId = () => "custom_" + Math.random().toString(36).slice(2, 9);

export interface CustomItemInput {
  name: string;
  group: ItemGroup;
  category: ShopItem["category"];
  slot: Slot;
  rarity: Rarity;
  price: number;
  imageDataUrl?: string;
  bonusPct: number;
  appliesTo?: ActivityType[] | "all";
}

function inputToRow(id: string, input: CustomItemInput) {
  return {
    id,
    name: input.name,
    group: input.group,
    category: input.category,
    slot: input.slot,
    rarity: input.rarity,
    price: input.price,
    image: input.imageDataUrl ?? null,
    bonus_pct: input.bonusPct,
    applies_to: (input.appliesTo ?? "all") as any,
  };
}

export async function addCustomItem(input: CustomItemInput): Promise<void> {
  const row = inputToRow(newId(), input);
  const { error } = await supabase.from("shop_items").insert(row);
  if (error) throw error;
  await refresh();
}

export async function updateCustomItem(itemId: string, patch: Partial<CustomItemInput>): Promise<void> {
  const row: Record<string, any> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.group !== undefined) row.group = patch.group;
  if (patch.category !== undefined) row.category = patch.category;
  if (patch.slot !== undefined) row.slot = patch.slot;
  if (patch.rarity !== undefined) row.rarity = patch.rarity;
  if (patch.price !== undefined) row.price = patch.price;
  if (patch.imageDataUrl !== undefined) row.image = patch.imageDataUrl ?? null;
  if (patch.bonusPct !== undefined) row.bonus_pct = patch.bonusPct;
  if (patch.appliesTo !== undefined) row.applies_to = patch.appliesTo as any;
  const { error } = await (supabase.from("shop_items") as any).update(row).eq("id", itemId);
  if (error) throw error;
  await refresh();
}

export async function deleteCustomItem(itemId: string): Promise<void> {
  const { error } = await supabase.from("shop_items").delete().eq("id", itemId);
  if (error) throw error;
  await refresh();
}

/** Hide a built-in item from every user's shop. */
export async function hideBuiltinItem(itemId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("hidden_builtin_items")
    .insert({ item_id: itemId, hidden_by: user?.id ?? null });
  if (error) throw error;
  await refresh();
}

export async function restoreBuiltinItem(itemId: string): Promise<void> {
  const { error } = await supabase.from("hidden_builtin_items").delete().eq("item_id", itemId);
  if (error) throw error;
  await refresh();
}

/** Hook to ensure the registry is initialized inside a component tree. */
export function useEnsureCatalogLoaded() {
  useEffect(() => { ensureInit(); }, []);
}

/** Heuristic: an "emoji" that's actually a data URL/image */
export function isImageEmoji(v: string | undefined): boolean {
  return !!v && (v.startsWith("data:") || v.startsWith("http") || v.startsWith("/"));
}
