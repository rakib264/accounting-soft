"use client";

import { Trash2 } from "lucide-react";
import { useCallback, useState } from "react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { DateRangePicker } from "@/components/shared/date-range-picker";
import { FileUpload } from "@/components/shared/file-upload";
import { FilterPanel } from "@/components/shared/filter-panel";
import { LoadingBlock, PageHeader, StatCard } from "@/components/shared/page-elements";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { SimpleTooltip, TooltipProvider } from "@/components/ui/tooltip";
import { DataTable } from "@/components/ui/data-table";
import { Label } from "@/components/ui/label";
import { useAppliedFilters } from "@/hooks/use-applied-filters";
import { validateTradeFiles } from "@/lib/file-validation-client";
import { formatCurrency, formatDate } from "@/lib/format";
import { showSuccess } from "@/lib/toast";
import {
  useCommitTradeTransactionsMutation,
  useGetTradeTransactionsQuery,
  useParseTradeFilesMutation,
} from "@/store/api/trade-api";
import { ColumnDef } from "@tanstack/react-table";

type PreviewRow = {
  id: string;
  sourceFile: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  reference?: string;
};

export default function TradePage() {
  return (
    <PermissionGate module="trade" action="view">
      <TradePageContent />
    </PermissionGate>
  );
}

type TradeDateFilters = { from: string; to: string };

const INITIAL_TRADE_FILTERS: TradeDateFilters = { from: "", to: "" };

function TradePageContent() {
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [fileError, setFileError] = useState<string>();
  const { draft, applied, apply, reset, patchDraft } = useAppliedFilters<TradeDateFilters>(INITIAL_TRADE_FILTERS);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const [parseFiles, { isLoading: parsing }] = useParseTradeFilesMutation();
  const [commitTransactions, { isLoading: committing }] = useCommitTradeTransactionsMutation();
  const { data, isLoading, refetch } = useGetTradeTransactionsQuery({
    from: applied.from || undefined,
    to: applied.to || undefined,
    page: pageIndex + 1,
    limit: pageSize,
  });

  async function handleParse(fileList: File[]) {
    const validation = validateTradeFiles(fileList);
    if (!validation.valid) {
      setFileError(validation.message);
      return;
    }

    setFileError(undefined);

    try {
      const result = await parseFiles(fileList).unwrap();
      const rows: PreviewRow[] = result.data.files.flatMap((file) =>
        file.transactions.map((tx, index) => ({
          id: `${file.fileName}-${index}`,
          sourceFile: file.fileName,
          date: typeof tx.date === "string" ? tx.date.slice(0, 10) : new Date(tx.date).toISOString().slice(0, 10),
          description: tx.description,
          debit: tx.debit,
          credit: tx.credit,
          balance: tx.balance,
          reference: tx.reference,
        })),
      );
      setPreviewRows(rows);
      showSuccess("Files parsed — review and correct rows before saving.");
    } catch {
      /* RTK error toast */
    }
  }

  const onDrop = useCallback(
    (files: File[]) => {
      if (files.length > 0) {
        void handleParse(files);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  function updatePreviewRow(id: string, field: keyof PreviewRow, value: string | number) {
    setPreviewRows((rows) => rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  }

  function removePreviewRow(id: string) {
    setPreviewRows((rows) => rows.filter((row) => row.id !== id));
  }

  async function handleCommit() {
    if (previewRows.length === 0) return;

    try {
      const grouped = previewRows.reduce<Record<string, PreviewRow[]>>((acc, row) => {
        acc[row.sourceFile] = acc[row.sourceFile] ?? [];
        acc[row.sourceFile].push(row);
        return acc;
      }, {});

      for (const [sourceFile, transactions] of Object.entries(grouped)) {
        await commitTransactions({
          sourceFile,
          transactions: transactions.map(({ sourceFile: _source, id: _id, ...tx }) => ({
            ...tx,
            date: tx.date,
          })),
        }).unwrap();
      }

      setPreviewRows([]);
      refetch();
      showSuccess("Trade transactions saved successfully.");
    } catch {
      /* Keep preview rows on error */
    }
  }

  const previewColumns: ColumnDef<PreviewRow>[] = [
    { accessorKey: "sourceFile", header: "Source" },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => (
        <Input
          type="date"
          value={row.original.date}
          onChange={(event) => updatePreviewRow(row.original.id, "date", event.target.value)}
          className="min-w-[140px]"
        />
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <Input
          value={row.original.description}
          onChange={(event) => updatePreviewRow(row.original.id, "description", event.target.value)}
        />
      ),
    },
    {
      accessorKey: "debit",
      header: "Debit",
      cell: ({ row }) => (
        <Input
          type="number"
          step="0.01"
          value={row.original.debit}
          onChange={(event) => updatePreviewRow(row.original.id, "debit", Number(event.target.value))}
          className="min-w-[100px]"
        />
      ),
    },
    {
      accessorKey: "credit",
      header: "Credit",
      cell: ({ row }) => (
        <Input
          type="number"
          step="0.01"
          value={row.original.credit}
          onChange={(event) => updatePreviewRow(row.original.id, "credit", Number(event.target.value))}
          className="min-w-[100px]"
        />
      ),
    },
    {
      accessorKey: "balance",
      header: "Balance",
      cell: ({ row }) => (
        <Input
          type="number"
          step="0.01"
          value={row.original.balance}
          onChange={(event) => updatePreviewRow(row.original.id, "balance", Number(event.target.value))}
          className="min-w-[100px]"
        />
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <TooltipProvider delayDuration={200}>
          <SimpleTooltip label="Remove row">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => removePreviewRow(row.original.id)}
              disabled={previewRows.length <= 1}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Remove row</span>
            </Button>
          </SimpleTooltip>
        </TooltipProvider>
      ),
    },
  ];

  const transactionColumns: ColumnDef<(typeof transactions)[number]>[] = [
    { accessorKey: "date", header: "Date", cell: ({ row }) => formatDate(row.original.date) },
    { accessorKey: "description", header: "Description" },
    { accessorKey: "debit", header: "Debit", cell: ({ row }) => formatCurrency(row.original.debit, "SAR") },
    { accessorKey: "credit", header: "Credit", cell: ({ row }) => formatCurrency(row.original.credit, "SAR") },
    { accessorKey: "balance", header: "Balance", cell: ({ row }) => formatCurrency(row.original.balance, "SAR") },
    { accessorKey: "reference", header: "Reference", cell: ({ row }) => row.original.reference ?? "—" },
    { accessorKey: "sourceFile", header: "Source File" },
  ];

  const transactions = data?.data.transactions ?? [];
  const pagination = data?.data.pagination;

  return (
    <div>
      <PageHeader title="Trade" description="Upload bank statements and review parsed transactions." />

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <StatCard title="Total Credit" value={data?.data.summary.totalCredit ?? 0} currency="SAR" />
        <StatCard title="Total Debit" value={data?.data.summary.totalDebit ?? 0} currency="SAR" />
        <StatCard title="Net Balance" value={data?.data.summary.netBalance ?? 0} currency="SAR" />
      </div>

      <div className="mb-8 rounded-xl border border-border bg-card p-6 shadow-sm">
        <FormField label="Statement files" error={fileError} hint="PDF, CSV, or XLSX up to 10MB each.">
            <FileUpload
              onSelect={onDrop}
            validateFiles={validateTradeFiles}
            onValidationError={setFileError}
            error={fileError}
              accept=".pdf,.csv,.xlsx,.xls"
            disabled={parsing}
            dropzoneLabel="Drag & drop bank statements here"
            dropzoneHint="or click to browse — PDF, CSV, or Excel up to 10MB"
          />
        </FormField>
        <div className="mt-4 flex justify-center gap-2">
          {previewRows.length > 0 && (
            <SubmitButton type="button" onClick={handleCommit} loading={committing} loadingText="Saving...">
              Commit to Database
            </SubmitButton>
          )}
          {parsing && <span className="text-sm text-muted-foreground">Parsing...</span>}
        </div>
      </div>

      {previewRows.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Preview &amp; Confirm ({previewRows.length} rows)</h2>
          <DataTable columns={previewColumns} data={previewRows} emptyMessage="No preview rows." enableColumnVisibility={false} />
        </div>
      )}

      <div className="mb-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Transaction history</h2>
        <FilterPanel
          className="mb-4"
          onApply={() => {
            apply();
            setPageIndex(0);
          }}
          onReset={() => {
            reset();
            setPageIndex(0);
          }}
          isApplying={isLoading}
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
      </div>

      {isLoading ? (
        <LoadingBlock />
      ) : (
        <DataTable
          columns={transactionColumns}
          data={transactions}
          pageCount={pagination?.totalPages ?? 1}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPageChange={setPageIndex}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPageIndex(0);
          }}
          emptyMessage="No trade transactions yet."
        />
      )}
    </div>
  );
}
