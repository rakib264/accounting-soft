import { Filter, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FilterPanelProps = {
  children: React.ReactNode;
  onApply: () => void;
  onReset: () => void;
  className?: string;
  applyLabel?: string;
  isApplying?: boolean;
};

export function FilterPanel({
  children,
  onApply,
  onReset,
  className,
  applyLabel = "Filter",
  isApplying,
}: FilterPanelProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-card/60 p-5 shadow-[var(--shadow-soft)] backdrop-blur-sm",
        className,
      )}
    >
      {children}
      <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-border/60 pt-4">
        <Button type="button" variant="outline" onClick={onReset}>
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
        <Button type="button" onClick={onApply} disabled={isApplying}>
          <Filter className="h-4 w-4" />
          {applyLabel}
        </Button>
      </div>
    </div>
  );
}
