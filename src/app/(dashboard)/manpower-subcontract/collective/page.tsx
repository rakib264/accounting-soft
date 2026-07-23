"use client";

import { SortingState } from "@tanstack/react-table";
import { useMemo, useState } from "react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { ProjectsTable } from "@/components/business/projects-table";
import { DateRangePicker } from "@/components/shared/date-range-picker";
import { FilterPanel } from "@/components/shared/filter-panel";
import { PageHeader, StatCard, FilterPill } from "@/components/shared/page-elements";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useAppliedFilters } from "@/hooks/use-applied-filters";
import { useGetModuleReportQuery, useGetProjectsQuery } from "@/store/api/business-api";
import { useGetInvoiceConfigQuery } from "@/store/api/settings-api";

type CollectiveFilters = {
  businessType: "" | "manpower" | "subcontract";
  projectId: string;
  from: string;
  to: string;
};

const INITIAL_FILTERS: CollectiveFilters = {
  businessType: "",
  projectId: "",
  from: "",
  to: "",
};

export default function CollectiveReportingPage() {
  return (
    <PermissionGate module="manpowerSubcontract" action="view">
      <CollectiveReportingContent />
    </PermissionGate>
  );
}

function CollectiveReportingContent() {
  const { draft, applied, apply, reset, patchDraft } = useAppliedFilters<CollectiveFilters>(INITIAL_FILTERS);
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);

  const sort = sorting[0];
  const { data: reportData, isLoading: reportLoading } = useGetModuleReportQuery({
    businessType: applied.businessType || undefined,
    projectId: applied.projectId || undefined,
    from: applied.from || undefined,
    to: applied.to || undefined,
  });
  const { data: projectsData, isLoading: projectsLoading } = useGetProjectsQuery({
    businessType: applied.businessType || undefined,
    search: search || undefined,
    page: pageIndex + 1,
    limit: pageSize,
    sortBy: sort?.id,
    sortOrder: sort?.desc ? "desc" : "asc",
  });
  const { data: allProjectsData } = useGetProjectsQuery({
    businessType: draft.businessType || undefined,
    limit: 100,
  });
  const { data: configData } = useGetInvoiceConfigQuery();

  const currency = configData?.data.currency ?? "SAR";
  const summary = reportData?.data.summary;
  const projects = useMemo(() => projectsData?.data.projects ?? [], [projectsData]);
  const pagination = projectsData?.data.pagination;
  const projectOptions = allProjectsData?.data.projects ?? [];

  function handleApply() {
    apply();
    setPageIndex(0);
  }

  function handleReset() {
    reset();
    setPageIndex(0);
  }

  const tableBusinessType =
    applied.businessType ||
    (projects[0]?.businessType as "manpower" | "subcontract" | undefined) ||
    "subcontract";

  return (
    <div>
      <PageHeader title="Collective Reporting" description="Combined view of Man-power and Sub-contract operations." />

      <FilterPanel className="mb-6" onApply={handleApply} onReset={handleReset} isApplying={reportLoading}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="collective-business-type">Business Type</Label>
            <Select
              id="collective-business-type"
              value={draft.businessType}
              onChange={(event) => {
                patchDraft({
                  businessType: event.target.value as CollectiveFilters["businessType"],
                  projectId: "",
                });
              }}
            >
              <option value="">Both</option>
              <option value="manpower">Man-power</option>
              <option value="subcontract">Sub-contract</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="collective-project">Project</Label>
            <Select
              id="collective-project"
              value={draft.projectId}
              onChange={(event) => patchDraft({ projectId: event.target.value })}
            >
              <option value="">All projects</option>
              {projectOptions.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2 xl:col-span-1">
            <Label htmlFor="collective-date-range">Date range</Label>
            <DateRangePicker
              id="collective-date-range"
              value={{ from: draft.from, to: draft.to }}
              onChange={(range) => patchDraft({ from: range.from, to: range.to })}
              placeholder="All dates"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2.5">
          {(["", "manpower", "subcontract"] as const).map((value) => (
            <FilterPill
              key={value || "both"}
              active={draft.businessType === value}
              onClick={() => patchDraft({ businessType: value, projectId: "" })}
            >
              {value === "" ? "Both" : value === "manpower" ? "Man-power" : "Sub-contract"}
            </FilterPill>
          ))}
        </div>
      </FilterPanel>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Total Projects" value={summary?.totalProjects ?? 0} accent="blue" />
        <StatCard title="Total Invoices" value={summary?.totalInvoices ?? 0} accent="violet" />
        <StatCard title="Total Invoice Amount" value={summary?.totalInvoiceAmount ?? 0} currency={currency} accent="primary" />
        <StatCard
          title="Total VAT"
          value={summary?.totalVatAmount ?? 0}
          currency={currency}
          accent="violet"
          subtitle="Preview only — not added to invoice totals"
        />
        <StatCard title="Total Expenses" value={summary?.totalExpenses ?? 0} currency={currency} accent="amber" />
        <StatCard title="Net Profit" value={summary?.netProfit ?? 0} currency={currency} accent="primary" />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground">Projects Overview</h2>
        <ProjectsTable
          projects={projects}
          businessType={tableBusinessType}
          pageCount={pagination?.totalPages ?? 1}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPageChange={setPageIndex}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPageIndex(0);
          }}
          sorting={sorting}
          onSortingChange={(next) => {
            setSorting(next);
            setPageIndex(0);
          }}
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPageIndex(0);
          }}
          isLoading={reportLoading || projectsLoading}
        />
      </div>
    </div>
  );
}
