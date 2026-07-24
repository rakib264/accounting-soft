"use client";

import { StatCard } from "@/components/shared/page-elements";
import { ReportSummary } from "@/store/api/business-api";

type ModuleSummaryCardsProps = {
  summary?: ReportSummary;
  currency: string;
  onNavigate?: (section: "projects" | "invoices" | "expenses") => void;
};

export function ModuleSummaryCards({ summary, currency, onNavigate }: ModuleSummaryCardsProps) {
  return (
    <div className="mb-8 grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-3 sm:gap-4">
      <StatCard
        title="Total Projects"
        value={summary?.totalProjects ?? 0}
        accent="blue"
        onClick={onNavigate ? () => onNavigate("projects") : undefined}
      />
      <StatCard
        title="Total Invoices"
        value={summary?.totalInvoices ?? 0}
        accent="violet"
        onClick={onNavigate ? () => onNavigate("invoices") : undefined}
      />
      <StatCard
        title="Total Invoice Amount (incl. VAT)"
        value={summary?.totalInvoiceAmount ?? 0}
        currency={currency}
        accent="primary"
        onClick={onNavigate ? () => onNavigate("invoices") : undefined}
      />
      <StatCard
        title="Total VAT"
        value={summary?.totalVatAmount ?? 0}
        currency={currency}
        accent="violet"
        onClick={onNavigate ? () => onNavigate("invoices") : undefined}
      />
      <StatCard
        title="Total Received"
        value={summary?.totalReceived ?? 0}
        currency={currency}
        accent="blue"
      />
      <StatCard
        title="Total Due"
        value={summary?.totalDue ?? 0}
        currency={currency}
        accent="amber"
      />
      <StatCard
        title="Total Expenses"
        value={summary?.totalExpenses ?? 0}
        currency={currency}
        accent="amber"
        onClick={onNavigate ? () => onNavigate("expenses") : undefined}
      />
      <StatCard
        title="Net Income"
        value={summary?.netIncome ?? 0}
        currency={currency}
        accent="primary"
      />
    </div>
  );
}
