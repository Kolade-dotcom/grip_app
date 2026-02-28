export const CHART_COLORS = {
  critical: "#ff4757",
  high: "#ffa502",
  medium: "#3b82f6",
  low: "#2ed573",
  accent: "#6e56ff",
} as const;

export function getGridColor(isDark: boolean): string {
  return isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.07)";
}

export function getTextColor(isDark: boolean): string {
  return isDark ? "#8d8d9b" : "#6b6b76";
}

export function getBgColor(isDark: boolean): string {
  return isDark ? "#16161a" : "#ffffff";
}
