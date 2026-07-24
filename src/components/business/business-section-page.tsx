"use client";

import { SortingState } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { ModuleSummaryCards } from "@/components/business/module-summary-cards";
import { ProjectFormDialog } from "@/components/business/project-form-dialog";
import { ProjectsTable } from "@/components/business/projects-table";
import { ReportExportButton } from "@/components/business/report-export-button";
import { PageHeader } from "@/components/shared/page-elements";
import { Button } from "@/components/ui/button";
import { usePermission } from "@/hooks/use-permission";
import { useGetModuleReportQuery, useGetProjectsQuery } from "@/store/api/business-api";
import { useGetInvoiceConfigQuery } from "@/store/api/settings-api";

type BusinessSectionProps = {
  businessType: "manpower" | "subcontract";
  title: string;
  description: string;
};

export function BusinessSectionPage({ businessType, title, description }: BusinessSectionProps) {
  return (
    <PermissionGate module="manpowerSubcontract" action="view">
      <BusinessSectionContent businessType={businessType} title={title} description={description} />
    </PermissionGate>
  );
}

function BusinessSectionContent({ businessType, title, description }: BusinessSectionProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const canCreate = usePermission("manpowerSubcontract", "create");

  const sort = sorting[0];
  const { data: reportData, isLoading: reportLoading } = useGetModuleReportQuery({ businessType });
  const { data: projectsData, isLoading: projectsLoading } = useGetProjectsQuery({
    businessType,
    search: search || undefined,
    page: pageIndex + 1,
    limit: pageSize,
    sortBy: sort?.id,
    sortOrder: sort?.desc ? "desc" : "asc",
  });
  const { data: configData } = useGetInvoiceConfigQuery();

  const currency = configData?.data.currency ?? "SAR";
  const summary = reportData?.data.summary;
  const basePath = `/manpower-subcontract/${businessType}`;
  const projects = useMemo(() => projectsData?.data.projects ?? [], [projectsData]);
  const pagination = projectsData?.data.pagination;

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <ReportExportButton businessType={businessType} />
            {canCreate ? <Button onClick={() => setDialogOpen(true)}>Add Project</Button> : null}
          </div>
        }
      />

      <ModuleSummaryCards
        summary={summary}
        currency={currency}
        onNavigate={(section) => router.push(`${basePath}${section === "projects" ? "#projects" : `/${section}`}`)}
      />

      <div id="projects" className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground">Projects</h2>
        <ProjectsTable
          projects={projects}
          businessType={businessType}
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

      <ProjectFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        businessType={businessType}
        onSuccess={() => setDialogOpen(false)}
      />
    </div>
  );
}
