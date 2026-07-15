"use client";

import { AttachmentGallery } from "@/components/shared/attachment-gallery";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/format";
import { Expense } from "@/store/api/business-api";

type ExpenseViewDialogProps = {
  expense: Expense | null;
  currency?: string;
  onOpenChange: (open: boolean) => void;
};

export function ExpenseViewDialog({ expense, currency = "SAR", onOpenChange }: ExpenseViewDialogProps) {
  return (
    <Dialog open={Boolean(expense)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Expense Details</DialogTitle>
        </DialogHeader>

        {expense && (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              {expense.projectName && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Project</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{expense.projectName}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total Amount</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{formatCurrency(expense.totalAmount ?? 0, currency)}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Created</p>
                <p className="mt-1 text-sm font-medium text-foreground">{formatDate(expense.createdAt)}</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Entries</p>
              {expense.entries.map((entry, index) => (
                <div key={`${entry.label}-${entry.date}-${index}`} className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Label</p>
                      <p className="mt-0.5 text-sm font-medium text-foreground">{entry.label}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Amount</p>
                      <p className="mt-0.5 text-sm font-medium text-foreground">{formatCurrency(entry.amount, currency)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Date</p>
                      <p className="mt-0.5 text-sm font-medium text-foreground">{formatDate(entry.date)}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Details</p>
                    <p className="mt-0.5 whitespace-pre-wrap text-sm text-foreground">{entry.details}</p>
                  </div>
                  {entry.attachments.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs text-muted-foreground">Attachments</p>
                      <AttachmentGallery urls={entry.attachments} emptyLabel="No attachments" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
