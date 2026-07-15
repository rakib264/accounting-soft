import { BASE_CHARCOAL, ThemeDefinition } from "@/lib/themes/types";

/**
 * shadcn/ui Green theme — light mode.
 * Foreground & dark surfaces use warm charcoal (#1A1A17) instead of pure black.
 * @see https://ui.shadcn.com/themes
 */
export const greenTheme: ThemeDefinition = {
  id: "green",
  label: "Green",
  description: "Professional emerald accent with warm charcoal base",
  tokens: {
    background: "#FAFAF8",
    foreground: BASE_CHARCOAL,
    card: "#FFFFFF",
    cardForeground: BASE_CHARCOAL,
    popover: "#FFFFFF",
    popoverForeground: BASE_CHARCOAL,

    /* shadcn green primary — hsl(142.1 76.2% 36.3%) */
    primary: "#16A34A",
    primaryForeground: "#F0FDF4",
    primaryHover: "#15803D",
    primaryGlow: "rgba(22, 163, 74, 0.22)",

    secondary: "#F5F5F2",
    secondaryForeground: BASE_CHARCOAL,

    muted: "#F0EFEB",
    mutedForeground: "#6B6B63",

    accent: "#ECFDF3",
    accentForeground: "#166534",

    destructive: "#DC2626",
    destructiveForeground: "#FEF2F2",

    border: "#E5E4DF",
    input: "#D9D8D2",
    ring: "#16A34A",

    success: "#16A34A",
    warning: "#D97706",

    base: BASE_CHARCOAL,
    sidebar: BASE_CHARCOAL,
    sidebarForeground: "#F5F5F2",
    sidebarMuted: "#A3A39A",
    sidebarAccent: "rgba(22, 163, 74, 0.16)",
    sidebarAccentForeground: "#86EFAC",
    sidebarBorder: "rgba(255, 255, 255, 0.08)",
    sidebarHover: "rgba(255, 255, 255, 0.06)",

    chart1: "#16A34A",
    chart2: "#A8A29E",
    chart3: "#2563EB",
    chart4: "#D97706",
    chart5: "#9333EA",

    statPrimary: "rgba(22, 163, 74, 0.14)",
    statBlue: "rgba(37, 99, 235, 0.14)",
    statAmber: "rgba(217, 119, 6, 0.14)",
    statViolet: "rgba(147, 51, 234, 0.14)",

    canvasGlowPrimary: "rgba(22, 163, 74, 0.08)",
    canvasGlowSecondary: "rgba(22, 163, 74, 0.04)",

    fieldGradientFrom: "#FFFFFF",
    fieldGradientTo: "#FAFAF8",

    shadowSoft: "0 1px 2px rgba(26, 26, 23, 0.04), 0 8px 24px rgba(26, 26, 23, 0.06)",
    shadowCard: "0 1px 3px rgba(26, 26, 23, 0.05), 0 12px 32px rgba(26, 26, 23, 0.08)",

    radius: "0.75rem",
  },
};
