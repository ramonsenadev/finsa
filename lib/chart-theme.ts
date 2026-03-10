/** Theme-aware color constants for Recharts */

export interface ChartColors {
  tickFill: string;
  tickFillStrong: string;
  gridStroke: string;
  accentPrimary: string;
  accentSecondary: string;
  warningStroke: string;
  cursorFill: string;
  dotStroke: string;
  weekendFill: string;
  referenceStroke: string;
  hiddenColor: string;
}

const lightColors: ChartColors = {
  tickFill: "#6b7280",
  tickFillStrong: "#111827",
  gridStroke: "#e5e7eb",
  accentPrimary: "#6366F1",
  accentSecondary: "#8B5CF6",
  warningStroke: "#F59E0B",
  cursorFill: "rgba(0,0,0,0.04)",
  dotStroke: "#ffffff",
  weekendFill: "#F3F4F6",
  referenceStroke: "#9CA3AF",
  hiddenColor: "#D1D5DB",
};

const darkColors: ChartColors = {
  tickFill: "#9CA3AF",
  tickFillStrong: "#F1F2F4",
  gridStroke: "#2D3140",
  accentPrimary: "#818CF8",
  accentSecondary: "#A78BFA",
  warningStroke: "#FBBF24",
  cursorFill: "rgba(255,255,255,0.06)",
  dotStroke: "#1A1D27",
  weekendFill: "#1A1D27",
  referenceStroke: "#6B7280",
  hiddenColor: "#4B5563",
};

export function getChartColors(resolvedTheme: string | undefined): ChartColors {
  return resolvedTheme === "dark" ? darkColors : lightColors;
}
