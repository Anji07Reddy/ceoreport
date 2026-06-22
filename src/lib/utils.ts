import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number with thousands separators, falling back to 0. */
export function formatNumber(n: number | null | undefined): string {
  return new Intl.NumberFormat("en-US").format(n ?? 0);
}

/** Format a currency value (INR by default). */
export function formatCurrency(n: number | null | undefined): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n ?? 0);
}

/** Format a percentage (0-100) with one decimal. */
export function formatPercent(n: number | null | undefined): string {
  return `${(n ?? 0).toFixed(1)}%`;
}

/** Render a Date (or ISO string) as YYYY-MM-DD. */
export function toDateString(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}
