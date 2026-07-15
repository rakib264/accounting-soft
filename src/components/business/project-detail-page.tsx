"use client";

import { ColumnDef, SortingState } from "@tanstack/react-table";
import { useMemo, useState } from "react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { ExpenseFormDialog } from "@/components/business/expense-form-dialog";
import { ExpenseViewDialog } from "@/components/business/expense-view-dialog";
import { InvoiceFormDialog } from "@/components/business/invoice-form-dialog";
import { InvoiceViewDialog } from "@/components/business/invoice-view-dialog";
import { AttachmentLinks } from "@/components/shared/attachment-links";
import { TableActions } from "@/components/shared/table-actions";
import { businessSectionLabel, businessSectionPath } from "@/components/shared/back-nav";
import { LoadingBlock, PageHeader } from "@/components/shared/page-elements";
import { ConfirmDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePermission } from "@/hooks/use-permission";
import { formatCurrency, formatDate } from "@/lib/format";
import { showSuccess } from "@/lib/toast";
import {
  Expense,
  Invoice,
  useDeleteExpenseMutation,
  useDeleteInvoiceMutation,
  useGetProjectExpensesQuery,
  useGetProjectInvoicesQuery,
  useGetProjectQuery,
} from "@/store/api/business-api";
import { useGetInvoiceConfigQuery } from "@/store/api/settings-api";

export function ProjectDetailPage({ projectId }: { projectId: string }) {
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const [deletingInvoice, setDeletingInvoice] = useState<Invoice | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [invoicePage, setInvoicePage] = useState(0);
  const [expensePage, setExpensePage] = useState(0);
  const [invoiceSorting, setInvoiceSorting] = useState<SortingState>([{ id: "invoiceDate", desc: true }]);
  const [expenseSorting, setExpenseSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);

  const canCreate = usePermission("manpowerSubcontract", "create");
  const canEdit = usePermission("manpowerSubcontract", "edit");
  const canDelete = usePermission("manpowerSubcontract", "delete");

  const invoiceSort = invoiceSorting[0];
  const expenseSort = expenseSorting[0];

  const { data: projectData, isLoading: projectLoading } = useGetProjectQuery(projectId);
  const { data: invoicesData, isLoading: invoicesLoading } = useGetProjectInvoicesQuery({
    projectId,
    page: invoicePage + 1,
    limit: 10,
    sortBy: invoiceSort?.id,
    sortOrder: invoiceSort?.desc ? "desc" : "asc",
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
      { accessorKey: "total", header: "Total", cell: ({ row }) => formatCurrency(row.original.total, currency) },
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
              <>
                <Button onClick={() => setInvoiceOpen(true)}>Add Invoice</Button>
                <Button variant="secondary" onClick={() => setExpenseOpen(true)}>Add Expense</Button>
              </>
            ) : undefined
          }
        />

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          {[
            { label: "Invoiced", value: formatCurrency(project.totalInvoiced, currency) },
            { label: "Expenses", value: formatCurrency(project.totalExpenses, currency) },
            { label: "Invoices", value: project.invoiceCount ?? 0 },
            { label: "Expense Records", value: project.expenseCount ?? 0 },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-xl font-bold text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="invoices">
          <TabsList>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
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
          open={Boolean(deletingExpense)}
          onOpenChange={(open) => !open && setDeletingExpense(null)}
          title="Delete expense?"
          description="This action cannot be undone."
          loading={deleteLoading}
          onConfirm={confirmDeleteExpense}
        />

        <InvoiceViewDialog
          invoice={viewingInvoice}
          currency={currency}
          onOpenChange={(open) => !open && setViewingInvoice(null)}
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
