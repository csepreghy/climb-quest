import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

let currentName: string | null = null;
let loadedForUser: string | null = null;
let loading = false;
const listeners = new Set<() => void>();

function notify() { listeners.forEach(l => l()); }

export function getCharacterName(): string | null { return currentName; }

export async function loadCharacterName(userId: string | null) {
  if (!userId) {
    currentName = null;
    loadedForUser = null;
    notify();
    return;
  }
  if (loadedForUser === userId || loading) return;
  loading = true;
  const { data } = await supabase
    .from("profiles")
    .select("character_name")
    .eq("id", userId)
    .maybeSingle();
  currentName = (data?.character_name as string | null) ?? null;
  loadedForUser = userId;
  loading = false;
  notify();
}

export function setCharacterNameLocal(name: string | null) {
  currentName = name;
  notify();
}

export async function setCharacterName(name: string): Promise<{ ok: true; name: string } | { ok: false; error: string }> {
  const { data, error } = await supabase.rpc("set_character_name", { p_name: name });
  if (error) return { ok: false, error: error.message.replace(/^.*: /, "") };
  setCharacterNameLocal(data as string);
  return { ok: true, name: data as string };
}

export async function isNameAvailable(name: string): Promise<boolean> {
  const trimmed = name.trim();
  if (trimmed.length < 2) return false;
  const { data, error } = await supabase.rpc("is_character_name_available", { p_name: trimmed });
  if (error) return false;
  return !!data;
}

export function useCharacterName(): string | null {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => currentName,
    () => currentName,
  );
}

/** Helper: load character name once when user changes. */
export function useLoadCharacterName(userId: string | null) {
  useEffect(() => { loadCharacterName(userId); }, [userId]);
}
