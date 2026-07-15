import { CSS_VAR_MAP, ThemeId, ThemeTokens } from "@/lib/themes/types";
import { getTheme } from "@/lib/themes/registry";

export function tokensToCssVars(tokens: ThemeTokens): Record<string, string> {
  const vars: Record<string, string> = {};

  for (const [key, cssVar] of Object.entries(CSS_VAR_MAP)) {
    vars[cssVar] = tokens[key as keyof ThemeTokens];
  }

  /* Layout tokens not tied to theme palette */
  vars["--sidebar-width"] = "17.5rem";
  vars["--sidebar-width-collapsed"] = "4.75rem";

  return vars;
}

export function applyThemeToDocument(themeId: ThemeId) {
  const theme = getTheme(themeId);
  const root = document.documentElement;

  root.setAttribute("data-theme", themeId);

  for (const [cssVar, value] of Object.entries(tokensToCssVars(theme.tokens))) {
    root.style.setProperty(cssVar, value);
  }
}

export function getThemeCssBlock(themeId: ThemeId): string {
  const vars = tokensToCssVars(getTheme(themeId).tokens);
  const declarations = Object.entries(vars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join("\n");

  return `[data-theme="${themeId}"] {\n${declarations}\n}`;
}
