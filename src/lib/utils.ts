import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format chalk-style numbers: full digits below 10,000, then a
 * compact "12.63k" form (two decimals) once we cross 10k.
 */
function stripTrailingZeros(s: string): string {
  return parseFloat(s).toString();
}

export function formatChalk(n: number | null | undefined): string {
  const v = typeof n === "number" && Number.isFinite(n) ? n : 0;
  if (Math.abs(v) >= 1_000_000) return `${stripTrailingZeros((v / 1_000_000).toFixed(2))}M`;
  if (Math.abs(v) >= 10_000) return `${stripTrailingZeros((v / 1_000).toFixed(2))}k`;
  return v.toLocaleString();
}
