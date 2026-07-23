"use client";

import { ColumnDef, SortingState } from "@tanstack/react-table";
import Link from "next/link";
import { useMemo, useState } from "react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { InvoiceViewDialog } from "@/components/business/invoice-view-dialog";
import { businessSectionLabel, businessSectionPath } from "@/components/shared/back-nav";
import { LoadingBlock, PageHeader } from "@/components/shared/page-elements";
import { TableActions } from "@/components/shared/table-actions";
import { DataTable } from "@/components/ui/data-table";
import { formatCurrency, formatDate } from "@/lib/format";
import { useGetInvoicesQuery } from "@/store/api/business-api";
import { useGetInvoiceConfigQuery } from "@/store/api/settings-api";
import { Invoice } from "@/store/api/business-api";

type Props = {
  businessType: "manpower" | "subcontract";
  title: string;
};

function InvoicesListContent({ businessType, title }: Props) {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([{ id: "invoiceDate", desc: true }]);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const sort = sorting[0];

  const { data, isLoading } = useGetInvoicesQuery({
    businessType,
    page: pageIndex + 1,
    limit: pageSize,
    sortBy: sort?.id,
    sortOrder: sort?.desc ? "desc" : "asc",
  });
  const { data: configData } = useGetInvoiceConfigQuery();
  const currency = configData?.data.currency ?? "SAR";

  const columns = useMemo<ColumnDef<Invoice>[]>(
    () => [
      { accessorKey: "invoiceDate", header: "Date", cell: ({ row }) => formatDate(row.original.invoiceDate) },
      {
        accessorKey: "projectName",
        header: "Project",
        cell: ({ row }) => (
          <Link href={`/manpower-subcontract/projects/${row.original.projectId}`} className="hover:underline">
            {row.original.projectName}
          </Link>
        ),
      },
      { accessorKey: "lineItemSummary", header: "Line Items" },
      { accessorKey: "subtotal", header: "Subtotal", cell: ({ row }) => formatCurrency(row.original.subtotal, currency) },
      {
        accessorKey: "vatAmount",
        header: "VAT (preview)",
        cell: ({ row }) => formatCurrency(row.original.vatAmount, currency),
      },
      {
        accessorKey: "total",
        header: "Total",
        cell: ({ row }) => formatCurrency(row.original.subtotal, currency),
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => (
          <TableActions
            canView
            canEdit={false}
            canDelete={false}
            onView={() => setViewingInvoice(row.original)}
            viewLabel="View invoice"
          />
        ),
      },
    ],
    [currency],
  );

  if (isLoading) return <LoadingBlock />;

  return (
    <div>
      <PageHeader
        title={title}
        description={`All invoices across ${businessType} projects.`}
        backHref={businessSectionPath(businessType)}
        backLabel={`Back to ${businessSectionLabel(businessType)}`}
      />
      <DataTable
        columns={columns}
        data={data?.data.invoices ?? []}
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

      <InvoiceViewDialog
        invoice={viewingInvoice}
        currency={currency}
        onOpenChange={(open) => !open && setViewingInvoice(null)}
      />
    </div>
  );
}

export function InvoicesListPage(props: Props) {
  return (
    <PermissionGate module="manpowerSubcontract" action="view">
      <InvoicesListContent {...props} />
    </PermissionGate>
  );
}
