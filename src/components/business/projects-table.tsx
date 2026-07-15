"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import Image from "next/image";
import { useMemo, useState } from "react";

import { ProjectFormDialog } from "@/components/business/project-form-dialog";
import { ConfirmDialog } from "@/components/ui/alert-dialog";
import { TableActions } from "@/components/shared/table-actions";
import { Badge } from "@/components/ui/table";
import { DataTable } from "@/components/ui/data-table";
import { usePermission } from "@/hooks/use-permission";
import { formatCurrency, formatDate, truncate } from "@/lib/format";
import { showSuccess } from "@/lib/toast";
import { useDeleteProjectMutation } from "@/store/api/business-api";
import { Project } from "@/store/api/business-api";
import { useGetInvoiceConfigQuery } from "@/store/api/settings-api";

type ProjectsTableProps = {
  projects: Project[];
  businessType: "manpower" | "subcontract";
  pageCount: number;
  pageIndex: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  sorting: SortingState;
  onSortingChange: (sorting: SortingState) => void;
  search: string;
  onSearchChange: (value: string) => void;
  isLoading?: boolean;
};

export function ProjectsTable({
  projects,
  businessType,
  pageCount,
  pageIndex,
  pageSize,
  onPageChange,
  onPageSizeChange,
  sorting,
  onSortingChange,
  search,
  onSearchChange,
  isLoading,
}: ProjectsTableProps) {
  const router = useRouter();
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const canEdit = usePermission("manpowerSubcontract", "edit");
  const canDelete = usePermission("manpowerSubcontract", "delete");
  const canView = usePermission("manpowerSubcontract", "view");
  const [deleteProject] = useDeleteProjectMutation();
  const { data: configData } = useGetInvoiceConfigQuery();
  const currency = configData?.data.currency ?? "SAR";

  async function handleConfirmDelete() {
    if (!deletingProject) return;
    setDeleteLoading(true);
    try {
      await deleteProject(deletingProject.id).unwrap();
      showSuccess("Project deleted successfully.");
      setDeletingProject(null);
    } catch {
      // Error toast via RTK
    } finally {
      setDeleteLoading(false);
    }
  }

  const columns = useMemo<ColumnDef<Project>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <Link href={`/manpower-subcontract/projects/${row.original.id}`} className="font-medium text-primary hover:underline">
            {row.original.name}
          </Link>
        ),
      },
      {
        accessorKey: "details",
        header: "Details",
        cell: ({ row }) => <span className="max-w-xs text-muted-foreground">{truncate(row.original.details)}</span>,
      },
      {
        accessorKey: "imageUrl",
        header: "Image",
        enableSorting: false,
        cell: ({ row }) =>
          row.original.imageUrl ? (
            <Image src={row.original.imageUrl} alt={row.original.name} width={40} height={40} className="h-10 w-10 rounded-md object-cover ring-1 ring-border" />
          ) : (
            <Badge>No image</Badge>
          ),
      },
      {
        accessorKey: "totalInvoiced",
        header: "Total Invoiced",
        cell: ({ row }) => formatCurrency(row.original.totalInvoiced, currency),
      },
      {
        accessorKey: "totalExpenses",
        header: "Total Expense",
        cell: ({ row }) => formatCurrency(row.original.totalExpenses, currency),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => (
          <TableActions
            canView={canView}
            canEdit={canEdit}
            canDelete={canDelete}
            onView={() => router.push(`/manpower-subcontract/projects/${row.original.id}`)}
            onEdit={() => setEditingProject(row.original)}
            onDelete={() => setDeletingProject(row.original)}
            viewLabel="View project"
            editLabel="Edit project"
            deleteLabel="Delete project"
          />
        ),
      },
    ],
    [canDelete, canEdit, canView, currency, router],
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={projects}
        pageCount={pageCount}
        pageIndex={pageIndex}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        sorting={sorting}
        onSortingChange={onSortingChange}
        searchValue={search}
        onSearchChange={onSearchChange}
        searchPlaceholder="Search projects..."
        isLoading={isLoading}
        emptyMessage="No projects found."
      />

      {editingProject && (
        <ProjectFormDialog
          open={Boolean(editingProject)}
          onOpenChange={(open) => !open && setEditingProject(null)}
          businessType={businessType}
          project={editingProject}
          onSuccess={() => setEditingProject(null)}
        />
      )}

      <ConfirmDialog
        open={Boolean(deletingProject)}
        onOpenChange={(open) => !open && setDeletingProject(null)}
        title="Delete project?"
        description={`This will permanently delete "${deletingProject?.name}" and all associated invoices and expenses.`}
        confirmLabel="Delete project"
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
