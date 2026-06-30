// Admin-managed shared shop items, persisted in Supabase.
// Custom items + hidden built-in ids live in two backend tables and are
// synced realtime to every user's client.
import { useSyncExternalStore, useEffect } from "react";
import { ShopItem, SHOP, ITEM_BY_ID, Rarity, ItemGroup, Slot, ActivityType, effectAllowed } from "./data";
import { supabase } from "@/integrations/supabase/client";
import { processAndUpload } from "@/lib/imageUpload";

interface State {
  custom: ShopItem[];
  hidden: Set<string>;
  loaded: boolean;
}

let state: State = { custom: [], hidden: new Set(), loaded: false };
const listeners = new Set<() => void>();
function emit() { listeners.forEach(l => l()); }
function setState(u: (s: State) => State) { state = u(state); emit(); }

// Lightweight columns — excludes `image` so the initial payload is tiny.
const LIGHT_COLS = "id,name,group,category,slot,rarity,price,bonus_pct,applies_to,level_req,price_mult,crit_chance_pct,boss_bonus_pct,board_bonus_pct,gender,created_at";

function rowToItem(r: any, image?: string | null): ShopItem {
  const bonusPct = Number(r.bonus_pct ?? 0);
  const priceMult = r.price_mult !== undefined && r.price_mult !== null ? Number(r.price_mult) : 1;
  const critPct = Number(r.crit_chance_pct ?? 0);
  const bossPct = Number(r.boss_bonus_pct ?? 0);
  const boardPct = Number(r.board_bonus_pct ?? 0);
  const gender = (r.gender as "male" | "female" | "unisex" | null) ?? "unisex";
  return {
    id: r.id,
    name: r.name,
    group: r.group as ItemGroup,
    category: r.category as ShopItem["category"],
    slot: r.slot as Slot,
    rarity: r.rarity as Rarity,
    price: r.price ?? 0,
    emoji: (image ?? r.image) ?? "",
    desc: "",
    levelReq: r.level_req ?? undefined,
    priceMult: priceMult !== 1 ? priceMult : undefined,
    critChancePct: critPct > 0 ? critPct : undefined,
    bossBonusPct: bossPct > 0 ? bossPct : undefined,
    boardBonusPct: boardPct > 0 ? boardPct : undefined,
    gender: gender !== "unisex" ? gender : undefined,
    bonus: bonusPct > 0
      ? { mult: bonusPct / 100, appliesTo: (r.applies_to ?? "all") as ActivityType[] | "all" }
      : undefined,
  };
}

async function refresh() {
  // 1. Fast: lightweight columns only — cards render instantly.
  const [light, hidden] = await Promise.all([
    (supabase.from("shop_items") as any).select(LIGHT_COLS).order("created_at", { ascending: true }),
    supabase.from("hidden_builtin_items").select("item_id"),
  ]);
  const lightItems = (light.data ?? []).map((r: any) => rowToItem(r, ""));
  setState(() => ({
    custom: lightItems,
    hidden: new Set((hidden.data ?? []).map((r: any) => r.item_id as string)),
    loaded: true,
  }));

  // 2. Stream images in as a separate query (still small for URLs, large only for legacy base64).
  const imgs = await supabase.from("shop_items").select("id,image");
  const imgById = new Map<string, string | null>();
  (imgs.data ?? []).forEach((r: any) => imgById.set(r.id, r.image));
  setState(s => ({
    ...s,
    custom: s.custom.map(it => {
      const img = imgById.get(it.id);
      return img ? { ...it, emoji: img } : it;
    }),
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

export function useCatalogLoaded(): boolean {
  return useSyncExternalStore(subscribe, () => state.loaded, () => state.loaded);
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
  /** Either a public URL (preferred), a data: URL (legacy), or a File to upload. */
  imageDataUrl?: string;
  imageFile?: File;
  bonusPct: number;
  appliesTo?: ActivityType[] | "all";
  levelReq?: number;
  /** Shop discount as a percentage off (0–100). 0 means no discount. */
  discountPct?: number;
  /** % chance log chalk doubles. */
  critChancePct?: number;
  /** Extra % chalk on boss attempts/sends. */
  bossBonusPct?: number;
  /** Gender restriction for Tops/Pants. */
  gender?: "male" | "female" | "unisex";
}

function inputToRow(id: string, input: CustomItemInput, imageUrl?: string | null) {
  const g = input.group, r = input.rarity;
  const discount = effectAllowed(g, r, "discount") ? Math.max(0, Math.min(100, input.discountPct ?? 0)) : 0;
  return {
    id,
    name: input.name,
    group: input.group,
    category: input.category,
    slot: input.slot,
    rarity: input.rarity,
    price: input.price,
    image: imageUrl ?? input.imageDataUrl ?? null,
    bonus_pct: effectAllowed(g, r, "chalk") ? input.bonusPct : 0,
    applies_to: (input.appliesTo ?? "all") as any,
    level_req: input.levelReq ?? null,
    price_mult: 1 - discount / 100,
    crit_chance_pct: Math.max(0, Math.min(100, input.critChancePct ?? 0)),
    boss_bonus_pct: Math.max(0, input.bossBonusPct ?? 0),
    gender: input.gender ?? "unisex",
  };
}

export async function addCustomItem(input: CustomItemInput): Promise<void> {
  const id = newId();
  let imageUrl: string | undefined;
  if (input.imageFile) {
    imageUrl = await processAndUpload(id, input.imageFile);
  } else if (input.imageDataUrl?.startsWith("data:")) {
    imageUrl = await processAndUpload(id, input.imageDataUrl);
  } else {
    imageUrl = input.imageDataUrl;
  }
  const row = inputToRow(id, input, imageUrl ?? null);
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
  if (patch.imageFile) {
    row.image = await processAndUpload(itemId, patch.imageFile);
  } else if (patch.imageDataUrl !== undefined) {
    row.image = patch.imageDataUrl?.startsWith("data:")
      ? await processAndUpload(itemId, patch.imageDataUrl)
      : (patch.imageDataUrl ?? null);
  }
  if (patch.bonusPct !== undefined) row.bonus_pct = patch.bonusPct;
  if (patch.appliesTo !== undefined) row.applies_to = patch.appliesTo as any;
  if (patch.levelReq !== undefined) row.level_req = patch.levelReq ?? null;
  if (patch.discountPct !== undefined) {
    const d = Math.max(0, Math.min(100, patch.discountPct));
    row.price_mult = 1 - d / 100;
  }
  if (patch.critChancePct !== undefined) row.crit_chance_pct = Math.max(0, Math.min(100, patch.critChancePct));
  if (patch.bossBonusPct !== undefined) row.boss_bonus_pct = Math.max(0, patch.bossBonusPct);
  if (patch.gender !== undefined) row.gender = patch.gender;
  const { error } = await (supabase.from("shop_items") as any).update(row).eq("id", itemId);
  if (error) throw error;
  await refresh();
}

export async function deleteCustomItem(itemId: string): Promise<void> {
  const { error } = await supabase.from("shop_items").delete().eq("id", itemId);
  if (error) throw error;
  // best-effort cleanup of stored image
  await supabase.storage.from("shop-item-images").remove([`${itemId}.webp`]).catch(() => {});
  await refresh();
}

/** Backfill: re-encode every shop item image to 360px webp in Storage. */
export async function backfillShopImages(
  onProgress?: (done: number, total: number, label: string) => void
): Promise<{ converted: number; skipped: number; failed: number }> {
  const { data, error } = await supabase.from("shop_items").select("id,name,image");
  if (error) throw error;
  const rows = (data ?? []) as Array<{ id: string; name: string; image: string | null }>;
  const targets = rows.filter(r => !!r.image);
  let converted = 0, failed = 0;
  for (let i = 0; i < targets.length; i++) {
    const r = targets[i];
    onProgress?.(i, targets.length, r.name);
    try {
      let src: string | File = r.image!;
      // For remote URLs we need to fetch as blob to avoid canvas tainting / re-decode at smaller size.
      if (r.image!.startsWith("http")) {
        const resp = await fetch(r.image!, { mode: "cors", cache: "no-store" });
        if (!resp.ok) throw new Error(`fetch ${resp.status}`);
        const blob = await resp.blob();
        src = new File([blob], `${r.id}.webp`, { type: blob.type || "image/webp" });
      }
      const url = await processAndUpload(r.id, src);
      const { error: upErr } = await (supabase.from("shop_items") as any).update({ image: url }).eq("id", r.id);
      if (upErr) throw upErr;
      converted++;
    } catch (e) {
      console.error("backfill failed for", r.id, e);
      failed++;
    }
  }
  onProgress?.(targets.length, targets.length, "done");
  await refresh();
  return { converted, skipped: rows.length - targets.length, failed };
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
