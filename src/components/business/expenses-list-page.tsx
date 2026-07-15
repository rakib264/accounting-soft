"use client";

import { ColumnDef, SortingState } from "@tanstack/react-table";
import Link from "next/link";
import { useMemo, useState } from "react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { ExpenseViewDialog } from "@/components/business/expense-view-dialog";
import { businessSectionLabel, businessSectionPath } from "@/components/shared/back-nav";
import { LoadingBlock, PageHeader } from "@/components/shared/page-elements";
import { TableActions } from "@/components/shared/table-actions";
import { DataTable } from "@/components/ui/data-table";
import { formatCurrency, formatDate } from "@/lib/format";
import { Expense, useGetExpensesQuery } from "@/store/api/business-api";
import { useGetInvoiceConfigQuery } from "@/store/api/settings-api";

type Props = {
  businessType: "manpower" | "subcontract";
  title: string;
};

function ExpensesListContent({ businessType, title }: Props) {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const sort = sorting[0];

  const { data, isLoading } = useGetExpensesQuery({
    businessType,
    page: pageIndex + 1,
    limit: pageSize,
    sortBy: sort?.id,
    sortOrder: sort?.desc ? "desc" : "asc",
  });
  const { data: configData } = useGetInvoiceConfigQuery();
  const currency = configData?.data.currency ?? "SAR";

  const columns = useMemo<ColumnDef<Expense>[]>(
    () => [
      {
        accessorKey: "projectName",
        header: "Project",
        cell: ({ row }) => (
          <Link href={`/manpower-subcontract/projects/${row.original.projectId}`} className="hover:underline">
            {row.original.projectName}
          </Link>
        ),
      },
      { accessorKey: "labelSummary", header: "Labels" },
      {
        accessorKey: "totalAmount",
        header: "Total Amount",
        cell: ({ row }) => formatCurrency(row.original.totalAmount ?? 0, currency),
      },
      { accessorKey: "createdAt", header: "Created", cell: ({ row }) => formatDate(row.original.createdAt) },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => (
          <TableActions
            canView
            canEdit={false}
            canDelete={false}
            onView={() => setViewingExpense(row.original)}
            viewLabel="View expense"
          />
        ),
      },
    ],
    [],
  );

  if (isLoading) return <LoadingBlock />;

  return (
    <div>
      <PageHeader
        title={title}
        description={`All expenses across ${businessType} projects.`}
        backHref={businessSectionPath(businessType)}
        backLabel={`Back to ${businessSectionLabel(businessType)}`}
      />
      <DataTable
        columns={columns}
        data={data?.data.expenses ?? []}
        pageCount={data?.data.pagination.totalPages ?? 1}
        pageIndex={pageIndex}
        pageSize={pageSize}
        onPageChange={setPageIndex}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPageIndex(0);
        }}
        sorting={sorting}
        onSortingChange={setSorting}
        isLoading={isLoading}
      />

      <ExpenseViewDialog
        expense={viewingExpense}
        currency={currency}
        onOpenChange={(open) => !open && setViewingExpense(null)}
      />
    </div>
  );
}

export function ExpensesListPage(props: Props) {
  return (
    <PermissionGate module="manpowerSubcontract" action="view">
      <ExpensesListContent {...props} />
    </PermissionGate>
  );
}
