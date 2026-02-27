import type { RiskLevel } from "@/types/risk";

/**
 * Format cents as dollar string: 4999 → "$49.99"
 */
export function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Format cents as short dollar string: 4999 → "$49"
 */
export function formatCurrencyShort(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1000) {
    return `$${(dollars / 1000).toFixed(1)}k`;
  }
  return `$${Math.round(dollars)}`;
}

/**
 * Format a date string as relative time: "2 days ago", "just now"
 */
export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

/**
 * Format a date string as short date: "Jan 15"
 */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * Format a date string as full date: "January 15, 2025"
 */
export function formatDateFull(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Get the Tailwind color class for a risk level.
 */
export function riskColor(level: RiskLevel): string {
  switch (level) {
    case "critical":
      return "text-risk-critical";
    case "high":
      return "text-risk-high";
    case "medium":
      return "text-risk-medium";
    case "low":
      return "text-risk-low";
  }
}

/**
 * Get the background color class for a risk level pill.
 */
export function riskBgColor(level: RiskLevel): string {
  switch (level) {
    case "critical":
      return "bg-risk-critical-bg text-risk-critical";
    case "high":
      return "bg-risk-high-bg text-risk-high";
    case "medium":
      return "bg-risk-medium-bg text-risk-medium";
    case "low":
      return "bg-risk-low-bg text-risk-low";
  }
}

/**
 * Truncate string with ellipsis.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + "…";
}

/**
 * Generate initials from a name: "John Doe" → "JD"
 */
export function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Classname helper: joins truthy values.
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
