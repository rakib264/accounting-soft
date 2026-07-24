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
import { ReportExportButton } from "@/components/business/report-export-button";
import { DateRangePicker } from "@/components/shared/date-range-picker";
import { FilterPanel } from "@/components/shared/filter-panel";
import { PageHeader, StatCard } from "@/components/shared/page-elements";
import { TableActions } from "@/components/shared/table-actions";
import { ConfirmDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppliedFilters } from "@/hooks/use-applied-filters";
import { usePermission } from "@/hooks/use-permission";
import { getInvoiceAmountDue, getInvoiceGrossTotal } from "@/lib/invoice-calculations";
import { formatCurrency, formatDate, formatOptionalDate } from "@/lib/format";
import { showSuccess, showWarning } from "@/lib/toast";
import {
  Expense,
  Invoice,
  ReceivedAmount,
  useCreateProjectMutation,
  useDeleteExpenseMutation,
  useDeleteInvoiceMutation,
  useDeleteReceivedAmountMutation,
  useGetExpensesQuery,
  useGetInvoicesQuery,
  useGetModuleReportQuery,
  useGetProjectsQuery,
  useGetReceivedAmountsQuery,
} from "@/store/api/business-api";
import { useGetInvoiceConfigQuery } from "@/store/api/settings-api";

type TradeFilters = {
  from: string;
  to: string;
};

const INITIAL_TRADE_FILTERS: TradeFilters = { from: "", to: "" };

export default function TradePage() {
  return (
    <PermissionGate module="trade" action="view">
      <TradePageContent />
    </PermissionGate>
  );
}

function TradePageContent() {
  const canCreate = usePermission("trade", "create");
  const canEdit = usePermission("trade", "edit");
  const canDelete = usePermission("trade", "delete");

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
  const [invoicePageSize, setInvoicePageSize] = useState(10);
  const [receivedPageSize, setReceivedPageSize] = useState(10);
  const [expensePageSize, setExpensePageSize] = useState(10);
  const [invoiceSorting, setInvoiceSorting] = useState<SortingState>([{ id: "invoiceDate", desc: true }]);
  const [receivedSorting, setReceivedSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [expenseSorting, setExpenseSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  const { draft, applied, apply, reset, patchDraft } = useAppliedFilters<TradeFilters>(INITIAL_TRADE_FILTERS);

  const invoiceSort = invoiceSorting[0];
  const receivedSort = receivedSorting[0];
  const expenseSort = expenseSorting[0];

  const { data: configData } = useGetInvoiceConfigQuery();
  const currency = configData?.data.currency ?? "SAR";

  const { data: defaultProjectData, isLoading: projectLookupLoading } = useGetProjectsQuery({
    businessType: "trade",
    page: 1,
    limit: 1,
  });
  const defaultTradeProjectId = defaultProjectData?.data.projects[0]?.id;

  const { data: reportData, isLoading: reportLoading } = useGetModuleReportQuery({
    businessType: "trade",
    from: applied.from || undefined,
    to: applied.to || undefined,
  });

  const { data: invoicesData, isLoading: invoicesLoading } = useGetInvoicesQuery({
    businessType: "trade",
    from: applied.from || undefined,
    to: applied.to || undefined,
    page: invoicePage + 1,
    limit: invoicePageSize,
    sortBy: invoiceSort?.id,
    sortOrder: invoiceSort?.desc ? "desc" : "asc",
  });

  const { data: receivedData, isLoading: receivedLoading } = useGetReceivedAmountsQuery({
    businessType: "trade",
    from: applied.from || undefined,
    to: applied.to || undefined,
    page: receivedPage + 1,
    limit: receivedPageSize,
    sortBy: receivedSort?.id,
    sortOrder: receivedSort?.desc ? "desc" : "asc",
  });

  const { data: expensesData, isLoading: expensesLoading } = useGetExpensesQuery({
    businessType: "trade",
    from: applied.from || undefined,
    to: applied.to || undefined,
    page: expensePage + 1,
    limit: expensePageSize,
    sortBy: expenseSort?.id,
    sortOrder: expenseSort?.desc ? "desc" : "asc",
  });

  const [deleteInvoice] = useDeleteInvoiceMutation();
  const [deleteReceived] = useDeleteReceivedAmountMutation();
  const [deleteExpense] = useDeleteExpenseMutation();
  const [createProject, { isLoading: creatingDefaultProject }] = useCreateProjectMutation();

  async function confirmDeleteInvoice() {
    if (!deletingInvoice) return;
    setDeleteLoading(true);
    try {
      await deleteInvoice(deletingInvoice.id).unwrap();
      setDeletingInvoice(null);
      showSuccess("Invoice deleted successfully.");
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
      setDeletingReceived(null);
      showSuccess("Received amount deleted successfully.");
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
      setDeletingExpense(null);
      showSuccess("Expense deleted successfully.");
    } catch {
      /* RTK handles error toast */
    } finally {
      setDeleteLoading(false);
    }
  }

  async function resolveTradeProjectId() {
    if (defaultTradeProjectId) return defaultTradeProjectId;

    try {
      const created = await createProject({
        name: "Trade Ledger",
        details: "Default trade workspace for invoices, received amounts, and expenses.",
        businessType: "trade",
      }).unwrap();
      return created.data.project.id;
    } catch {
      showWarning("Unable to prepare trade workspace automatically. Please contact admin.");
      return null;
    }
  }

  async function openCreateDialog(dialog: "invoice" | "received" | "expense") {
    const projectId = await resolveTradeProjectId();
    if (!projectId) return;

    setActiveProjectId(projectId);
    if (dialog === "invoice") setInvoiceOpen(true);
    if (dialog === "received") setReceivedOpen(true);
    if (dialog === "expense") setExpenseOpen(true);
  }

  const invoiceColumns = useMemo<ColumnDef<Invoice>[]>(
    () => [
      { accessorKey: "invoiceDate", header: "Date", cell: ({ row }) => formatDate(row.original.invoiceDate) },
      { accessorKey: "lineItemSummary", header: "Line Items" },
      { accessorKey: "subtotal", header: "Subtotal", cell: ({ row }) => formatCurrency(row.original.subtotal, currency) },
      { accessorKey: "vatAmount", header: "VAT", cell: ({ row }) => formatCurrency(row.original.vatAmount, currency) },
      {
        accessorKey: "total",
        header: "Total (incl. VAT)",
        cell: ({ row }) => formatCurrency(getInvoiceGrossTotal(row.original), currency),
      },
      {
        accessorKey: "amountReceived",
        header: "Received",
        cell: ({ row }) => formatCurrency(row.original.amountReceived ?? 0, currency),
      },
      {
        accessorKey: "amountDue",
        header: "Due",
        cell: ({ row }) =>
          formatCurrency(
            row.original.amountDue ?? getInvoiceAmountDue(row.original, row.original.amountReceived ?? 0),
            currency,
          ),
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
        header: "Received Date",
        cell: ({ row }) => formatOptionalDate(row.original.receivedDate),
      },
      {
        accessorKey: "invoiceAmountDue",
        header: "Balance Due",
        cell: ({ row }) => formatCurrency(row.original.invoiceAmountDue ?? 0, currency),
      },
      {
        accessorKey: "createdAt",
        header: "Recorded",
        cell: ({ row }) => formatDate(row.original.createdAt),
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

  const summary = reportData?.data.summary;
  const totalReceivedEntries = receivedData?.data.pagination.totalDocs ?? 0;

  return (
    <div>
      <PageHeader
        title="Trade"
        description="Trade financial dashboard with invoices, received amounts, and expenses."
        actions={
          <div className="w-full sm:w-auto">
            <ReportExportButton
              businessType="trade"
              from={applied.from || undefined}
              to={applied.to || undefined}
              label="Download Trade Report"
              className="w-full sm:w-auto"
            />
          </div>
        }
      />

      <FilterPanel
        className="mb-6"
        onApply={() => {
          apply();
          setInvoicePage(0);
          setReceivedPage(0);
          setExpensePage(0);
        }}
        onReset={() => {
          reset();
          setInvoicePage(0);
          setReceivedPage(0);
          setExpensePage(0);
        }}
        isApplying={reportLoading || projectLookupLoading}
      >
        <div className="max-w-md space-y-2">
          <Label htmlFor="trade-date-range">Date range</Label>
          <DateRangePicker
            id="trade-date-range"
            value={{ from: draft.from, to: draft.to }}
            onChange={(range) => patchDraft({ from: range.from, to: range.to })}
            placeholder="All dates"
          />
        </div>
      </FilterPanel>

      <div className="mb-8 grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-3 sm:gap-4">
        <StatCard title="Total Invoice Entries" value={summary?.totalInvoices ?? 0} accent="violet" />
        <StatCard
          title="Total Invoice Amount (incl. VAT)"
          value={summary?.totalInvoiceAmount ?? 0}
          currency={currency}
          accent="primary"
        />
        <StatCard title="Total Received Amount" value={summary?.totalReceived ?? 0} currency={currency} accent="blue" />
        <StatCard title="Total Received Entries" value={totalReceivedEntries} accent="blue" />
        <StatCard title="Total Expense" value={summary?.totalExpenses ?? 0} currency={currency} accent="amber" />
        <StatCard title="Total VAT" value={summary?.totalVatAmount ?? 0} currency={currency} accent="violet" />
        <StatCard title="Total Due" value={summary?.totalDue ?? 0} currency={currency} accent="amber" />
        <StatCard title="Total Net Income" value={summary?.netIncome ?? 0} currency={currency} accent="primary" />
      </div>

      <Tabs defaultValue="invoices" className="space-y-4">
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
            pageSize={invoicePageSize}
            onPageChange={setInvoicePage}
            onPageSizeChange={(size) => {
              setInvoicePageSize(size);
              setInvoicePage(0);
            }}
            sorting={invoiceSorting}
            onSortingChange={(next) => {
              setInvoiceSorting(next);
              setInvoicePage(0);
            }}
            isLoading={invoicesLoading}
            emptyMessage="No trade invoices found."
            toolbar={
              canCreate ? (
                <Button
                  onClick={() => void openCreateDialog("invoice")}
                  disabled={creatingDefaultProject || projectLookupLoading}
                >
                  Add Invoice
                </Button>
              ) : undefined
            }
          />
        </TabsContent>

        <TabsContent value="received">
          <DataTable
            columns={receivedColumns}
            data={receivedData?.data.receivedAmounts ?? []}
            pageCount={receivedData?.data.pagination.totalPages ?? 1}
            pageIndex={receivedPage}
            pageSize={receivedPageSize}
            onPageChange={setReceivedPage}
            onPageSizeChange={(size) => {
              setReceivedPageSize(size);
              setReceivedPage(0);
            }}
            sorting={receivedSorting}
            onSortingChange={(next) => {
              setReceivedSorting(next);
              setReceivedPage(0);
            }}
            isLoading={receivedLoading}
            emptyMessage="No trade received amounts found."
            toolbar={
              canCreate ? (
                <Button
                  className="bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-400 dark:bg-emerald-500 dark:hover:bg-emerald-400"
                  onClick={() => void openCreateDialog("received")}
                  disabled={creatingDefaultProject || projectLookupLoading}
                >
                  Add Received Amount
                </Button>
              ) : undefined
            }
          />
        </TabsContent>

        <TabsContent value="expenses">
          <DataTable
            columns={expenseColumns}
            data={expensesData?.data.expenses ?? []}
            pageCount={expensesData?.data.pagination.totalPages ?? 1}
            pageIndex={expensePage}
            pageSize={expensePageSize}
            onPageChange={setExpensePage}
            onPageSizeChange={(size) => {
              setExpensePageSize(size);
              setExpensePage(0);
            }}
            sorting={expenseSorting}
            onSortingChange={(next) => {
              setExpenseSorting(next);
              setExpensePage(0);
            }}
            isLoading={expensesLoading}
            emptyMessage="No trade expenses found."
            toolbar={
              canCreate ? (
                <Button
                  className="bg-amber-600 text-white hover:bg-amber-700 focus-visible:ring-amber-400 dark:bg-amber-500 dark:hover:bg-amber-400"
                  onClick={() => void openCreateDialog("expense")}
                  disabled={creatingDefaultProject || projectLookupLoading}
                >
                  Add Expense
                </Button>
              ) : undefined
            }
          />
        </TabsContent>
      </Tabs>

      {activeProjectId && (
        <>
          <InvoiceFormDialog open={invoiceOpen} onOpenChange={setInvoiceOpen} projectId={activeProjectId} />
          <ReceivedAmountFormDialog open={receivedOpen} onOpenChange={setReceivedOpen} projectId={activeProjectId} />
          <ExpenseFormDialog open={expenseOpen} onOpenChange={setExpenseOpen} projectId={activeProjectId} />
        </>
      )}

      {editingInvoice && (
        <InvoiceFormDialog
          open={Boolean(editingInvoice)}
          onOpenChange={(open) => !open && setEditingInvoice(null)}
          projectId={editingInvoice.projectId}
          invoice={editingInvoice}
          onSuccess={() => setEditingInvoice(null)}
        />
      )}

      {editingReceived && (
        <ReceivedAmountFormDialog
          open={Boolean(editingReceived)}
          onOpenChange={(open) => !open && setEditingReceived(null)}
          projectId={editingReceived.projectId}
          receivedAmount={editingReceived}
          onSuccess={() => setEditingReceived(null)}
        />
      )}

      {editingExpense && (
        <ExpenseFormDialog
          open={Boolean(editingExpense)}
          onOpenChange={(open) => !open && setEditingExpense(null)}
          projectId={editingExpense.projectId}
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
        projectId={viewingInvoice?.projectId}
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
  );
}
