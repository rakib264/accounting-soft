import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";

type BackNavProps = {
  href: string;
  label: string;
  className?: string;
};

export function BackNav({ href, label, className }: BackNavProps) {
  return (
    <Link
      href={href}
      className={cn(
        "-ml-1 inline-flex w-fit items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted/70 hover:text-primary",
        className,
      )}
    >
      <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
      {label}
    </Link>
  );
}

export function businessSectionLabel(businessType: "manpower" | "subcontract" | "trade") {
  if (businessType === "manpower") return "Man-power";
  if (businessType === "subcontract") return "Sub-contract";
  return "Trade";
}

export function businessSectionPath(businessType: "manpower" | "subcontract" | "trade") {
  if (businessType === "trade") return "/trade";
  return `/manpower-subcontract/${businessType}`;
}
