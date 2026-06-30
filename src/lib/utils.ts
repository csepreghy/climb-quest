import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format chalk-style numbers: full digits below 10,000, then a
 * compact "12.63k" form (two decimals) once we cross 10k.
 */
export function formatChalk(n: number | null | undefined): string {
  const v = typeof n === "number" && Number.isFinite(n) ? n : 0;
  if (Math.abs(v) >= 10000) return `${(v / 1000).toFixed(2)}k`;
  return v.toLocaleString();
}
