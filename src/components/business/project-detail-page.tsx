"use client";

import { ColumnDef, SortingState } from "@tanstack/react-table";
import { useMemo, useState } from "react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { ExpenseFormDialog } from "@/components/business/expense-form-dialog";
import { ExpenseViewDialog } from "@/components/business/expense-view-dialog";
import { InvoiceFormDialog } from "@/components/business/invoice-form-dialog";
import { InvoiceViewDialog } from "@/components/business/invoice-view-dialog";
import { ReceivedAmountFormDialog } from "@/components/business/received-amount-form-dialog";
import { ReceivedAmountViewDialog } from "@/components/business/received-amount-view-dialog";
import { AttachmentLinks } from "@/components/shared/attachment-links";
import { TableActions } from "@/components/shared/table-actions";
import { businessSectionLabel, businessSectionPath } from "@/components/shared/back-nav";
import { LoadingBlock, PageHeader, StatCard } from "@/components/shared/page-elements";
import { ConfirmDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePermission } from "@/hooks/use-permission";
import { getInvoiceAmountDue, getInvoiceGrossTotal } from "@/lib/invoice-calculations";
import { formatCurrency, formatDate, formatOptionalDate } from "@/lib/format";
import { showSuccess } from "@/lib/toast";
import {
  Expense,
  Invoice,
  ReceivedAmount,
  useDeleteExpenseMutation,
  useDeleteInvoiceMutation,
  useDeleteReceivedAmountMutation,
  useGetProjectExpensesQuery,
  useGetProjectInvoicesQuery,
  useGetProjectQuery,
  useGetProjectReceivedAmountsQuery,
} from "@/store/api/business-api";
import { useGetInvoiceConfigQuery } from "@/store/api/settings-api";

export function ProjectDetailPage({ projectId }: { projectId: string }) {
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [receivedOpen, setReceivedOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editingReceived, setEditingReceived] = useState<ReceivedAmount | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [viewingReceived, setViewingReceived] = useState<ReceivedAmount | null>(null);
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const [deletingInvoice, setDeletingInvoice] = useState<Invoice | null>(null);
  const [deletingReceived, setDeletingReceived] = useState<ReceivedAmount | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [invoicePage, setInvoicePage] = useState(0);
  const [receivedPage, setReceivedPage] = useState(0);
  const [expensePage, setExpensePage] = useState(0);
  const [invoiceSorting, setInvoiceSorting] = useState<SortingState>([{ id: "invoiceDate", desc: true }]);
  const [receivedSorting, setReceivedSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [expenseSorting, setExpenseSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);

  const canCreate = usePermission("manpowerSubcontract", "create");
  const canEdit = usePermission("manpowerSubcontract", "edit");
  const canDelete = usePermission("manpowerSubcontract", "delete");

  const invoiceSort = invoiceSorting[0];
  const receivedSort = receivedSorting[0];
  const expenseSort = expenseSorting[0];

  const { data: projectData, isLoading: projectLoading } = useGetProjectQuery(projectId);
  const { data: invoicesData, isLoading: invoicesLoading } = useGetProjectInvoicesQuery({
    projectId,
    page: invoicePage + 1,
    limit: 10,
    sortBy: invoiceSort?.id,
    sortOrder: invoiceSort?.desc ? "desc" : "asc",
  });
  const { data: receivedData, isLoading: receivedLoading } = useGetProjectReceivedAmountsQuery({
    projectId,
    page: receivedPage + 1,
    limit: 10,
    sortBy: receivedSort?.id,
    sortOrder: receivedSort?.desc ? "desc" : "asc",
  });
  const { data: expensesData, isLoading: expensesLoading } = useGetProjectExpensesQuery({
    projectId,
    page: expensePage + 1,
    limit: 10,
    sortBy: expenseSort?.id,
    sortOrder: expenseSort?.desc ? "desc" : "asc",
  });
  const { data: configData } = useGetInvoiceConfigQuery();
  const [deleteInvoice] = useDeleteInvoiceMutation();
  const [deleteReceived] = useDeleteReceivedAmountMutation();
  const [deleteExpense] = useDeleteExpenseMutation();

  const currency = configData?.data.currency ?? "SAR";
  const project = projectData?.data.project;

  async function confirmDeleteInvoice() {
    if (!deletingInvoice) return;
    setDeleteLoading(true);
    try {
      await deleteInvoice(deletingInvoice.id).unwrap();
      showSuccess("Invoice deleted successfully.");
      setDeletingInvoice(null);
    } catch {
      /* RTK handles error toast */
    } finally {
      setDeleteLoading(false);
    }
  }

  async function confirmDeleteReceived() {
    if (!deletingReceived) return;
    setDeleteLoading(true);
    try {
      await deleteReceived(deletingReceived.id).unwrap();
      showSuccess("Received amount deleted successfully.");
      setDeletingReceived(null);
    } catch {
      /* RTK handles error toast */
    } finally {
      setDeleteLoading(false);
    }
  }

  async function confirmDeleteExpense() {
    if (!deletingExpense) return;
    setDeleteLoading(true);
    try {
      await deleteExpense(deletingExpense.id).unwrap();
      showSuccess("Expense deleted successfully.");
      setDeletingExpense(null);
    } catch {
      /* RTK handles error toast */
    } finally {
      setDeleteLoading(false);
    }
  }

  const invoiceColumns = useMemo<ColumnDef<Invoice>[]>(
    () => [
      { accessorKey: "invoiceDate", header: "Date", cell: ({ row }) => formatDate(row.original.invoiceDate) },
      { accessorKey: "lineItemSummary", header: "Line Items" },
      { accessorKey: "subtotal", header: "Subtotal", cell: ({ row }) => formatCurrency(row.original.subtotal, currency) },
      { accessorKey: "vatAmount", header: "VAT", cell: ({ row }) => formatCurrency(row.original.vatAmount, currency) },
      { accessorKey: "total", header: "Total (incl. VAT)", cell: ({ row }) => formatCurrency(getInvoiceGrossTotal(row.original), currency) },
      {
        accessorKey: "amountReceived",
        header: "Received",
        cell: ({ row }) => formatCurrency(row.original.amountReceived ?? 0, currency),
      },
      {
        accessorKey: "amountDue",
        header: "Balance Due",
        cell: ({ row }) => formatCurrency(row.original.amountDue ?? getInvoiceAmountDue(row.original, row.original.amountReceived ?? 0), currency),
      },
      {
        accessorKey: "attachments",
        header: "Files",
        enableSorting: false,
        cell: ({ row }) => <AttachmentLinks urls={row.original.attachments} />,
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => (
          <TableActions
            canView
            canEdit={canEdit}
            canDelete={canDelete}
            onView={() => setViewingInvoice(row.original)}
            onEdit={() => setEditingInvoice(row.original)}
            onDelete={() => setDeletingInvoice(row.original)}
            viewLabel="View invoice"
            editLabel="Edit invoice"
            deleteLabel="Delete invoice"
          />
        ),
      },
    ],
    [canDelete, canEdit, currency],
  );

  const receivedColumns = useMemo<ColumnDef<ReceivedAmount>[]>(
    () => [
      {
        accessorKey: "invoiceLabel",
        header: "Invoice",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.invoiceLabel ?? "—"}</p>
            <p className="text-xs text-muted-foreground">
              {row.original.invoiceDate ? formatDate(row.original.invoiceDate) : "—"}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "amount",
        header: "Received",
        cell: ({ row }) => formatCurrency(row.original.amount, currency),
      },
      {
        accessorKey: "receivedDate",
        header: "Date",
        cell: ({ row }) => formatOptionalDate(row.original.receivedDate),
      },
      {
        accessorKey: "invoiceAmountDue",
        header: "Balance Due",
        cell: ({ row }) => formatCurrency(row.original.invoiceAmountDue ?? 0, currency),
      },
      { accessorKey: "createdAt", header: "Recorded", cell: ({ row }) => formatDate(row.original.createdAt) },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => (
          <TableActions
            canView
            canEdit={canEdit}
            canDelete={canDelete}
            onView={() => setViewingReceived(row.original)}
            onEdit={() => setEditingReceived(row.original)}
            onDelete={() => setDeletingReceived(row.original)}
            viewLabel="View received amount"
            editLabel="Edit received amount"
            deleteLabel="Delete received amount"
          />
        ),
      },
    ],
    [canDelete, canEdit, currency],
  );

  const expenseColumns = useMemo<ColumnDef<Expense>[]>(
    () => [
      { accessorKey: "labelSummary", header: "Labels" },
      {
        accessorKey: "totalAmount",
        header: "Total Amount",
        cell: ({ row }) => formatCurrency(row.original.totalAmount ?? 0, currency),
      },
      { id: "entries", header: "Entries", cell: ({ row }) => row.original.entries.length },
      { accessorKey: "createdAt", header: "Created", cell: ({ row }) => formatDate(row.original.createdAt) },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => (
          <TableActions
            canView
            canEdit={canEdit}
            canDelete={canDelete}
            onView={() => setViewingExpense(row.original)}
            onEdit={() => setEditingExpense(row.original)}
            onDelete={() => setDeletingExpense(row.original)}
            viewLabel="View expense"
            editLabel="Edit expense"
            deleteLabel="Delete expense"
          />
        ),
      },
    ],
    [canDelete, canEdit, currency],
  );

  if (projectLoading) return <LoadingBlock />;
  if (!project) return <p className="text-muted-foreground">Project not found.</p>;

  return (
    <PermissionGate module="manpowerSubcontract" action="view">
      <div>
        <PageHeader
          title={project.name}
          description={project.details}
          backHref={businessSectionPath(project.businessType)}
          backLabel={`Back to ${businessSectionLabel(project.businessType)}`}
          actions={
            canCreate ? (
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
                <Button onClick={() => setInvoiceOpen(true)}>Add Invoice</Button>
                <Button
                  className="bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-400 dark:bg-emerald-500 dark:hover:bg-emerald-400"
                  onClick={() => setReceivedOpen(true)}
                >
                  Add Received Amount
                </Button>
                <Button
                  className="bg-amber-600 text-white hover:bg-amber-700 focus-visible:ring-amber-400 dark:bg-amber-500 dark:hover:bg-amber-400"
                  onClick={() => setExpenseOpen(true)}
                >
                  Add Expense
                </Button>
              </div>
            ) : undefined
          }
        />

        <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-3 sm:gap-4">
          <StatCard title="Invoiced (incl. VAT)" value={project.totalInvoiced} currency={currency} accent="primary" />
          <StatCard title="Received" value={project.totalReceived ?? 0} currency={currency} accent="blue" />
          <StatCard title="Total Due" value={project.totalDue ?? 0} currency={currency} accent="amber" />
          <StatCard title="Net Income" value={project.netIncome ?? 0} currency={currency} accent="primary" />
          <StatCard title="Total VAT" value={project.totalVatAmount ?? 0} currency={currency} accent="violet" />
          <StatCard title="Total Expenses" value={project.totalExpenses} currency={currency} accent="amber" />
          <StatCard title="Total Invoices" value={project.invoiceCount ?? 0} accent="violet" />
          <StatCard title="Total Received Entries" value={project.receivedCount ?? 0} accent="blue" />
          <StatCard title="Total Expense Entries" value={project.expenseCount ?? 0} accent="amber" />
        </div>

        <Tabs defaultValue="invoices">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
            <TabsTrigger value="invoices" className="flex-1 sm:flex-none">
              Invoices
            </TabsTrigger>
            <TabsTrigger value="received" className="flex-1 sm:flex-none">
              Received Amount
            </TabsTrigger>
            <TabsTrigger value="expenses" className="flex-1 sm:flex-none">
              Expenses
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invoices">
            <DataTable
              columns={invoiceColumns}
              data={invoicesData?.data.invoices ?? []}
              pageCount={invoicesData?.data.pagination.totalPages ?? 1}
              pageIndex={invoicePage}
              pageSize={10}
              onPageChange={setInvoicePage}
              sorting={invoiceSorting}
              onSortingChange={setInvoiceSorting}
              isLoading={invoicesLoading}
            />
          </TabsContent>

          <TabsContent value="received">
            <DataTable
              columns={receivedColumns}
              data={receivedData?.data.receivedAmounts ?? []}
              pageCount={receivedData?.data.pagination.totalPages ?? 1}
              pageIndex={receivedPage}
              pageSize={10}
              onPageChange={setReceivedPage}
              sorting={receivedSorting}
              onSortingChange={setReceivedSorting}
              isLoading={receivedLoading}
              emptyMessage="No received amounts recorded yet."
            />
          </TabsContent>

          <TabsContent value="expenses">
            <DataTable
              columns={expenseColumns}
              data={expensesData?.data.expenses ?? []}
              pageCount={expensesData?.data.pagination.totalPages ?? 1}
              pageIndex={expensePage}
              pageSize={10}
              onPageChange={setExpensePage}
              sorting={expenseSorting}
              onSortingChange={setExpenseSorting}
              isLoading={expensesLoading}
            />
          </TabsContent>
        </Tabs>

        <InvoiceFormDialog open={invoiceOpen} onOpenChange={setInvoiceOpen} projectId={projectId} />
        <ReceivedAmountFormDialog open={receivedOpen} onOpenChange={setReceivedOpen} projectId={projectId} />
        <ExpenseFormDialog open={expenseOpen} onOpenChange={setExpenseOpen} projectId={projectId} />

        {editingInvoice && (
          <InvoiceFormDialog
            open={Boolean(editingInvoice)}
            onOpenChange={(open) => !open && setEditingInvoice(null)}
            projectId={projectId}
            invoice={editingInvoice}
            onSuccess={() => setEditingInvoice(null)}
          />
        )}

        {editingReceived && (
          <ReceivedAmountFormDialog
            open={Boolean(editingReceived)}
            onOpenChange={(open) => !open && setEditingReceived(null)}
            projectId={projectId}
            receivedAmount={editingReceived}
            onSuccess={() => setEditingReceived(null)}
          />
        )}

        {editingExpense && (
          <ExpenseFormDialog
            open={Boolean(editingExpense)}
            onOpenChange={(open) => !open && setEditingExpense(null)}
            projectId={projectId}
            expense={editingExpense}
            onSuccess={() => setEditingExpense(null)}
          />
        )}

        <ConfirmDialog
          open={Boolean(deletingInvoice)}
          onOpenChange={(open) => !open && setDeletingInvoice(null)}
          title="Delete invoice?"
          description="This action cannot be undone."
          loading={deleteLoading}
          onConfirm={confirmDeleteInvoice}
        />

        <ConfirmDialog
          open={Boolean(deletingReceived)}
          onOpenChange={(open) => !open && setDeletingReceived(null)}
          title="Delete received amount?"
          description="This action cannot be undone."
          loading={deleteLoading}
          onConfirm={confirmDeleteReceived}
        />

        <ConfirmDialog
          open={Boolean(deletingExpense)}
          onOpenChange={(open) => !open && setDeletingExpense(null)}
          title="Delete expense?"
          description="This action cannot be undone."
          loading={deleteLoading}
          onConfirm={confirmDeleteExpense}
        />

        <InvoiceViewDialog
          invoice={viewingInvoice}
          projectId={projectId}
          currency={currency}
          onOpenChange={(open) => !open && setViewingInvoice(null)}
        />

        <ReceivedAmountViewDialog
          receivedAmount={viewingReceived}
          currency={currency}
          onOpenChange={(open) => !open && setViewingReceived(null)}
        />

        <ExpenseViewDialog
          expense={viewingExpense}
          currency={currency}
          onOpenChange={(open) => !open && setViewingExpense(null)}
        />
      </div>
    </PermissionGate>
  );
}
