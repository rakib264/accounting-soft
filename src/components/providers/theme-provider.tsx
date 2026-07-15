"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { applyThemeToDocument } from "@/lib/themes/apply-theme";
import { DEFAULT_THEME_ID, getTheme, themeList, isThemeId } from "@/lib/themes/registry";
import { THEME_STORAGE_KEY, ThemeDefinition, ThemeId } from "@/lib/themes/types";

type ThemeContextValue = {
  themeId: ThemeId;
  theme: ThemeDefinition;
  themes: ThemeDefinition[];
  setTheme: (id: ThemeId) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): ThemeId {
  if (typeof window === "undefined") return DEFAULT_THEME_ID;
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored && isThemeId(stored) ? stored : DEFAULT_THEME_ID;
}

export function ThemeProvider({
  children,
  defaultTheme = DEFAULT_THEME_ID,
}: {
  children: React.ReactNode;
  defaultTheme?: ThemeId;
}) {
  const [themeId, setThemeId] = useState<ThemeId>(defaultTheme);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initial = readStoredTheme();
    setThemeId(initial);
    applyThemeToDocument(initial);
    setReady(true);
  }, []);

  const setTheme = useCallback((id: ThemeId) => {
    setThemeId(id);
    applyThemeToDocument(id);
    localStorage.setItem(THEME_STORAGE_KEY, id);
  }, []);

  const value = useMemo(
    () => ({
      themeId,
      theme: getTheme(themeId),
      themes: themeList,
      setTheme,
    }),
    [themeId, setTheme],
  );

  /* Avoid flash: SSR uses data-theme on html; client syncs on mount */
  if (!ready) {
    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

/** Read chart/stat colors from active CSS variables (Recharts, etc.) */
export function useThemeColors() {
  const { themeId } = useTheme();
  const [colors, setColors] = useState({
    chart1: getTheme(themeId).tokens.chart1,
    chart2: getTheme(themeId).tokens.chart2,
    chart3: getTheme(themeId).tokens.chart3,
    mutedForeground: getTheme(themeId).tokens.mutedForeground,
    border: getTheme(themeId).tokens.border,
  });

  useEffect(() => {
    const style = getComputedStyle(document.documentElement);
    setColors({
      chart1: style.getPropertyValue("--chart-1").trim() || getTheme(themeId).tokens.chart1,
      chart2: style.getPropertyValue("--chart-2").trim() || getTheme(themeId).tokens.chart2,
      chart3: style.getPropertyValue("--chart-3").trim() || getTheme(themeId).tokens.chart3,
      mutedForeground: style.getPropertyValue("--muted-foreground").trim() || getTheme(themeId).tokens.mutedForeground,
      border: style.getPropertyValue("--border").trim() || getTheme(themeId).tokens.border,
    });
  }, [themeId]);

  return colors;
}
