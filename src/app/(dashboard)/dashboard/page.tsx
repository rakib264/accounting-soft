"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { useThemeColors } from "@/components/providers/theme-provider";
import { LoadingBlock, PageHeader, StatCard } from "@/components/shared/page-elements";
import { useGetDashboardReportQuery } from "@/store/api/business-api";
import { useGetInvoiceConfigQuery } from "@/store/api/settings-api";

export default function DashboardPage() {
  const { data, isLoading } = useGetDashboardReportQuery();
  const { data: configData } = useGetInvoiceConfigQuery();
  const colors = useThemeColors();

  if (isLoading) return <LoadingBlock />;

  const summary = data?.data.summary;
  const trend = data?.data.monthlyTrend ?? [];
  const currency = configData?.data.currency ?? "SAR";

  return (
    <div>
      <PageHeader title="Dashboard" description="High-level overview across all business lines." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
        <StatCard title="Total Projects" value={summary?.totalProjects ?? 0} accent="blue" />
        <StatCard title="Total Invoices" value={summary?.totalInvoices ?? 0} accent="violet" />
        <StatCard title="Total Revenue" value={summary?.totalRevenue ?? 0} currency={currency} accent="primary" />
        <StatCard title="Total Expenses" value={summary?.totalExpenses ?? 0} currency={currency} accent="amber" />
        <StatCard title="Net Profit" value={summary?.netProfit ?? 0} currency={currency} accent="primary" />
        <StatCard title="Trade Credit" value={summary?.tradeCredit ?? 0} currency={currency} accent="blue" />
        <StatCard title="Trade Debit" value={summary?.tradeDebit ?? 0} currency={currency} accent="amber" />
      </div>

      <div className="mt-10 overflow-hidden rounded-2xl border border-border/80 bg-card p-6 shadow-[var(--shadow-soft)]">
        <h2 className="mb-6 text-lg font-bold tracking-tight text-foreground">Monthly Invoice vs Expense Trend</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.border} />
              <XAxis dataKey="label" tick={{ fill: colors.mutedForeground, fontSize: 12 }} />
              <YAxis tick={{ fill: colors.mutedForeground, fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" name="Invoices" fill={colors.chart1} radius={[6, 6, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill={colors.chart2} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
