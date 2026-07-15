import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { BackNav } from "@/components/shared/back-nav";

type StatCardProps = {
  title: string;
  value: number | string;
  subtitle?: string;
  currency?: string;
  onClick?: () => void;
  className?: string;
  accent?: "primary" | "blue" | "amber" | "violet";
};

const accentStyles = {
  primary: "bg-[var(--stat-primary)] text-primary",
  blue: "bg-[var(--stat-blue)] text-[var(--chart-3)]",
  amber: "bg-[var(--stat-amber)] text-[var(--chart-4)]",
  violet: "bg-[var(--stat-violet)] text-[var(--chart-5)]",
};

export function StatCard({ title, value, subtitle, currency, onClick, className, accent = "primary" }: StatCardProps) {
  const displayValue = typeof value === "number" && currency ? formatCurrency(value, currency) : value;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 text-left shadow-[var(--shadow-soft)] transition-all duration-300",
        onClick && "hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[var(--shadow-card)]",
        "disabled:cursor-default disabled:hover:translate-y-0 disabled:hover:border-border/80 disabled:hover:shadow-[var(--shadow-soft)]",
        className,
      )}
    >
      <div className={cn("pointer-events-none absolute inset-x-0 top-0 h-16 opacity-80", accentStyles[accent])} />
      <p className="relative text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <p className="relative mt-3 font-sans text-[1.65rem] font-bold leading-none tracking-tight text-foreground">{displayValue}</p>
      {subtitle && <p className="relative mt-2 text-xs text-muted-foreground">{subtitle}</p>}
      {onClick && (
        <span className="relative mt-3 inline-flex text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
          View details →
        </span>
      )}
    </button>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  backHref,
  backLabel,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-3">
        {backHref && backLabel && <BackNav href={backHref} label={backLabel} />}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Overview</p>
          <h1 className="font-sans text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{title}</h1>
          {description && <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2.5">{actions}</div>}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/70 p-14 text-center shadow-[var(--shadow-soft)] backdrop-blur-sm">
      <p className="text-lg font-semibold text-foreground">{title}</p>
      {description && <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>}
    </div>
  );
}

export function LoadingBlock() {
  return (
    <div className="space-y-5">
      <div className="h-11 w-56 animate-pulse rounded-xl bg-muted" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
  );
}

export function FilterPill({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200",
        active
          ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
          : "border border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
