import { blueTheme } from "@/lib/themes/blue.theme";
import { greenTheme } from "@/lib/themes/green.theme";
import { zincTheme } from "@/lib/themes/zinc.theme";
import { ThemeDefinition, ThemeId } from "@/lib/themes/types";

export const DEFAULT_THEME_ID: ThemeId = "green";

export const themeRegistry: Record<ThemeId, ThemeDefinition> = {
  green: greenTheme,
  blue: blueTheme,
  zinc: zincTheme,
  rose: {
    ...greenTheme,
    id: "rose",
    label: "Rose",
    description: "Warm rose accent — stub using green structure",
    tokens: {
      ...greenTheme.tokens,
      primary: "#E11D48",
      primaryForeground: "#FFF1F2",
      primaryHover: "#BE123C",
      primaryGlow: "rgba(225, 29, 72, 0.22)",
      ring: "#E11D48",
      accent: "#FFF1F2",
      accentForeground: "#BE123C",
      sidebarAccent: "rgba(225, 29, 72, 0.16)",
      sidebarAccentForeground: "#FDA4AF",
      chart1: "#E11D48",
      statPrimary: "rgba(225, 29, 72, 0.14)",
      canvasGlowPrimary: "rgba(225, 29, 72, 0.08)",
      canvasGlowSecondary: "rgba(225, 29, 72, 0.04)",
    },
  },
};

export const themeList = Object.values(themeRegistry);

export function getTheme(id: ThemeId): ThemeDefinition {
  return themeRegistry[id] ?? themeRegistry[DEFAULT_THEME_ID];
}

export function isThemeId(value: string): value is ThemeId {
  return value in themeRegistry;
}
