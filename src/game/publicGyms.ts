// Admin-managed public gyms accessible to everyone.
import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Gym, GradingSystem } from "./gyms";

interface PublicGymsState {
  gyms: Gym[];
  gradingSystems: GradingSystem[];
  loaded: boolean;
}

let state: PublicGymsState = { gyms: [], gradingSystems: [], loaded: false };
const listeners = new Set<() => void>();
function emit() { listeners.forEach(l => l()); }
function set(s: PublicGymsState) { state = s; emit(); }

export function getPublicGymsSnapshot() { return state; }

export async function loadPublicGyms() {
  const { data, error } = await supabase
    .from("public_gyms")
    .select("id, data, grading_systems");
  if (error) {
    console.warn("[publicGyms] load failed", error.message);
    set({ ...state, loaded: true });
    return;
  }
  const gyms: Gym[] = [];
  const gsMap = new Map<string, GradingSystem>();
  for (const row of data ?? []) {
    const g = row.data as unknown as Gym;
    gyms.push({ ...g, id: row.id });
    const list = (row.grading_systems as unknown as GradingSystem[]) ?? [];
    for (const gs of list) gsMap.set(gs.id, gs);
  }
  set({ gyms, gradingSystems: [...gsMap.values()], loaded: true });
}

export function usePublicGyms(): PublicGymsState {
  useEffect(() => { if (!state.loaded) loadPublicGyms(); }, []);
  return useSyncExternalStore(
    cb => { listeners.add(cb); return () => listeners.delete(cb); },
    () => state,
    () => state,
  );
}

const id = () => Math.random().toString(36).slice(2, 9);

export async function addPublicGym(name: string, location: string) {
  const gym: Gym = {
    id: id(),
    name, location,
    primary: false,
    holdColors: [
      { id: "white", name: "White", hex: "#f5f5f5" },
      { id: "yellow", name: "Yellow", hex: "#fbbf24" },
      { id: "orange", name: "Orange", hex: "#f97316" },
      { id: "red", name: "Red", hex: "#ef4444" },
      { id: "blue", name: "Blue", hex: "#3b82f6" },
      { id: "green", name: "Green", hex: "#22c55e" },
      { id: "black", name: "Black", hex: "#1f2937" },
    ],
    gradingSystemIds: ["v_grades"],
  };
  const { error } = await supabase.from("public_gyms").insert({
    id: gym.id, data: gym as any, grading_systems: [] as any,
  });
  if (error) throw error;
  await loadPublicGyms();
}

export async function updatePublicGym(gymId: string, patch: Partial<Gym>) {
  const current = state.gyms.find(g => g.id === gymId);
  if (!current) return;
  const next = { ...current, ...patch };
  const { error } = await supabase.from("public_gyms")
    .update({ data: next as any }).eq("id", gymId);
  if (error) throw error;
  set({ ...state, gyms: state.gyms.map(g => g.id === gymId ? next : g) });
}

export async function deletePublicGym(gymId: string) {
  const { error } = await supabase.from("public_gyms").delete().eq("id", gymId);
  if (error) throw error;
  set({ ...state, gyms: state.gyms.filter(g => g.id !== gymId) });
}

export async function setPublicGymGradingSystems(gymId: string, list: GradingSystem[]) {
  const { error } = await supabase.from("public_gyms")
    .update({ grading_systems: list as any }).eq("id", gymId);
  if (error) throw error;
  await loadPublicGyms();
}
