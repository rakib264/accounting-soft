/** Warm charcoal from brand — replaces pure black across all themes */
export const BASE_CHARCOAL = "#1A1A17";

export type ThemeId = "green" | "blue" | "zinc" | "rose";

export type ThemeTokens = {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  primaryHover: string;
  primaryGlow: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  success: string;
  warning: string;
  /** Structural dark surface (sidebar, login backdrop) */
  base: string;
  sidebar: string;
  sidebarForeground: string;
  sidebarMuted: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarHover: string;
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
  statPrimary: string;
  statBlue: string;
  statAmber: string;
  statViolet: string;
  canvasGlowPrimary: string;
  canvasGlowSecondary: string;
  fieldGradientFrom: string;
  fieldGradientTo: string;
  shadowSoft: string;
  shadowCard: string;
  radius: string;
};

export type ThemeDefinition = {
  id: ThemeId;
  label: string;
  description: string;
  tokens: ThemeTokens;
};

export const THEME_STORAGE_KEY = "app-theme";

export const CSS_VAR_MAP: Record<keyof ThemeTokens, string> = {
  background: "--background",
  foreground: "--foreground",
  card: "--card",
  cardForeground: "--card-foreground",
  popover: "--popover",
  popoverForeground: "--popover-foreground",
  primary: "--primary",
  primaryForeground: "--primary-foreground",
  primaryHover: "--primary-hover",
  primaryGlow: "--primary-glow",
  secondary: "--secondary",
  secondaryForeground: "--secondary-foreground",
  muted: "--muted",
  mutedForeground: "--muted-foreground",
  accent: "--accent",
  accentForeground: "--accent-foreground",
  destructive: "--destructive",
  destructiveForeground: "--destructive-foreground",
  border: "--border",
  input: "--input",
  ring: "--ring",
  success: "--success",
  warning: "--warning",
  base: "--base",
  sidebar: "--sidebar",
  sidebarForeground: "--sidebar-foreground",
  sidebarMuted: "--sidebar-muted",
  sidebarAccent: "--sidebar-accent",
  sidebarAccentForeground: "--sidebar-accent-foreground",
  sidebarBorder: "--sidebar-border",
  sidebarHover: "--sidebar-hover",
  chart1: "--chart-1",
  chart2: "--chart-2",
  chart3: "--chart-3",
  chart4: "--chart-4",
  chart5: "--chart-5",
  statPrimary: "--stat-primary",
  statBlue: "--stat-blue",
  statAmber: "--stat-amber",
  statViolet: "--stat-violet",
  canvasGlowPrimary: "--canvas-glow-primary",
  canvasGlowSecondary: "--canvas-glow-secondary",
  fieldGradientFrom: "--field-gradient-from",
  fieldGradientTo: "--field-gradient-to",
  shadowSoft: "--shadow-soft",
  shadowCard: "--shadow-card",
  radius: "--radius",
};
