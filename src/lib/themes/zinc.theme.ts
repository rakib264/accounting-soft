import { BASE_CHARCOAL, ThemeDefinition } from "@/lib/themes/types";

/** shadcn Zinc theme stub — ready for client switching */
export const zincTheme: ThemeDefinition = {
  id: "zinc",
  label: "Zinc",
  description: "Neutral zinc accent with warm charcoal base",
  tokens: {
    background: "#FAFAF8",
    foreground: BASE_CHARCOAL,
    card: "#FFFFFF",
    cardForeground: BASE_CHARCOAL,
    popover: "#FFFFFF",
    popoverForeground: BASE_CHARCOAL,

    primary: "#3F3F46",
    primaryForeground: "#FAFAFA",
    primaryHover: "#27272A",
    primaryGlow: "rgba(63, 63, 70, 0.18)",

    secondary: "#F5F5F2",
    secondaryForeground: BASE_CHARCOAL,

    muted: "#F0EFEB",
    mutedForeground: "#6B6B63",

    accent: "#F4F4F5",
    accentForeground: "#27272A",

    destructive: "#DC2626",
    destructiveForeground: "#FEF2F2",

    border: "#E5E4DF",
    input: "#D9D8D2",
    ring: "#3F3F46",

    success: "#16A34A",
    warning: "#D97706",

    base: BASE_CHARCOAL,
    sidebar: BASE_CHARCOAL,
    sidebarForeground: "#F5F5F2",
    sidebarMuted: "#A3A39A",
    sidebarAccent: "rgba(255, 255, 255, 0.08)",
    sidebarAccentForeground: "#E4E4E7",
    sidebarBorder: "rgba(255, 255, 255, 0.08)",
    sidebarHover: "rgba(255, 255, 255, 0.06)",

    chart1: "#3F3F46",
    chart2: "#A8A29E",
    chart3: "#2563EB",
    chart4: "#D97706",
    chart5: "#9333EA",

    statPrimary: "rgba(63, 63, 70, 0.12)",
    statBlue: "rgba(37, 99, 235, 0.14)",
    statAmber: "rgba(217, 119, 6, 0.14)",
    statViolet: "rgba(147, 51, 234, 0.14)",

    canvasGlowPrimary: "rgba(63, 63, 70, 0.06)",
    canvasGlowSecondary: "rgba(63, 63, 70, 0.03)",

    fieldGradientFrom: "#FFFFFF",
    fieldGradientTo: "#FAFAF8",

    shadowSoft: "0 1px 2px rgba(26, 26, 23, 0.04), 0 8px 24px rgba(26, 26, 23, 0.06)",
    shadowCard: "0 1px 3px rgba(26, 26, 23, 0.05), 0 12px 32px rgba(26, 26, 23, 0.08)",

    radius: "0.75rem",
  },
};
