"use client";

import { cn } from "@/lib/utils";
import { useTheme } from "@/components/providers/theme-provider";
import { ThemeId } from "@/lib/themes/types";

const themeSwatches: Record<ThemeId, string> = {
  green: "#16A34A",
  blue: "#2563EB",
  zinc: "#3F3F46",
  rose: "#E11D48",
};

export function ThemeSwitcher({ className }: { className?: string }) {
  const { themeId, themes, setTheme } = useTheme();

  return (
    <div className={cn("grid gap-3 sm:grid-cols-2", className)}>
      {themes.map((theme) => {
        const active = theme.id === themeId;
        return (
          <button
            key={theme.id}
            type="button"
            onClick={() => setTheme(theme.id)}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-4 text-left transition-all",
              active
                ? "border-primary bg-accent/50 ring-2 ring-primary/20"
                : "border-border bg-card hover:border-primary/30",
            )}
          >
            <span
              className="mt-0.5 h-8 w-8 shrink-0 rounded-full ring-2 ring-border"
              style={{ backgroundColor: themeSwatches[theme.id] }}
            />
            <span>
              <span className="block text-sm font-semibold text-foreground">{theme.label}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{theme.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
