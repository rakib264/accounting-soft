import {
  BarChart3,
  BanknoteArrowDown,
  BanknoteArrowUp,
  Building2,
  CircleDollarSign,
  FileText,
  HandCoins,
  Landmark,
  PiggyBank,
  ReceiptText,
  TrendingUp,
} from "lucide-react";

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
  primary: "from-primary/12 via-primary/6 to-card",
  blue: "from-sky-500/14 via-sky-400/8 to-card",
  amber: "from-amber-500/16 via-orange-400/8 to-card",
  violet: "from-violet-500/14 via-purple-400/8 to-card",
};

const accentIconStyles = {
  primary: "bg-primary/12 text-primary ring-primary/20",
  blue: "bg-sky-500/12 text-sky-700 ring-sky-500/20 dark:text-sky-300",
  amber: "bg-amber-500/16 text-amber-700 ring-amber-500/25 dark:text-amber-300",
  violet: "bg-violet-500/14 text-violet-700 ring-violet-500/20 dark:text-violet-300",
};

export function StatCard({ title, value, subtitle, currency, onClick, className, accent = "primary" }: StatCardProps) {
  const displayValue = typeof value === "number" && currency ? formatCurrency(value, currency) : value;
  const normalizedTitle = title.toLowerCase();

  const Icon =
    normalizedTitle.includes("project")
      ? Building2
      : normalizedTitle.includes("invoice")
        ? FileText
        : normalizedTitle.includes("received")
          ? PiggyBank
          : normalizedTitle.includes("expense")
            ? HandCoins
            : normalizedTitle.includes("vat")
              ? ReceiptText
              : normalizedTitle.includes("due")
                ? CircleDollarSign
                : normalizedTitle.includes("credit")
                  ? BanknoteArrowUp
                  : normalizedTitle.includes("debit")
                    ? BanknoteArrowDown
                    : normalizedTitle.includes("revenue")
                      ? Landmark
                      : normalizedTitle.includes("net") || normalizedTitle.includes("profit") || normalizedTitle.includes("income")
                        ? TrendingUp
                        : BarChart3;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/80 bg-linear-to-br p-5 text-left shadow-(--shadow-soft) transition-all duration-300",
        accentStyles[accent],
        onClick && "hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-(--shadow-card)",
        "disabled:cursor-default disabled:hover:translate-y-0 disabled:hover:border-border/80 disabled:hover:shadow-(--shadow-soft)",
        className,
      )}
    >
      <div className={cn("absolute right-4 top-4 rounded-xl p-2.5 ring-1", accentIconStyles[accent])}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="relative text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <p className="relative mt-4 max-w-full wrap-break-word pr-14 font-sans text-[clamp(1rem,2.5vw,1.65rem)] font-bold leading-tight tracking-tight text-foreground">
        {displayValue}
      </p>
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
          {description && <p className="max-w-2xl leading-relaxed text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2.5">{actions}</div>}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/70 p-14 text-center shadow-(--shadow-soft) backdrop-blur-sm">
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
