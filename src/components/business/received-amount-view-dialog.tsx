"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency, formatDate, formatOptionalDate } from "@/lib/format";
import { ReceivedAmount } from "@/store/api/business-api";

type ReceivedAmountViewDialogProps = {
  receivedAmount: ReceivedAmount | null;
  currency?: string;
  onOpenChange: (open: boolean) => void;
};

export function ReceivedAmountViewDialog({ receivedAmount, currency = "SAR", onOpenChange }: ReceivedAmountViewDialogProps) {
  return (
    <Dialog open={Boolean(receivedAmount)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Received Amount Details</DialogTitle>
        </DialogHeader>

        {receivedAmount && (
          <div className="space-y-4 text-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Invoice</p>
                <p className="mt-1 font-medium text-foreground">{receivedAmount.invoiceLabel ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Invoice Date</p>
                <p className="mt-1 font-medium text-foreground">
                  {receivedAmount.invoiceDate ? formatDate(receivedAmount.invoiceDate) : "—"}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-accent/30 p-4">
              <div className="flex justify-between">
                <span>Invoice Total (incl. VAT)</span>
                <span>{formatCurrency(receivedAmount.invoiceTotal ?? 0, currency)}</span>
              </div>
              <div className="mt-2 flex justify-between font-semibold text-accent-foreground">
                <span>This Payment</span>
                <span>{formatCurrency(receivedAmount.amount, currency)}</span>
              </div>
              <div className="mt-2 flex justify-between text-muted-foreground">
                <span>Total Received on Invoice</span>
                <span>{formatCurrency(receivedAmount.invoiceAmountReceived ?? 0, currency)}</span>
              </div>
              <div className="mt-2 flex justify-between font-medium">
                <span>Balance Due on Invoice</span>
                <span>{formatCurrency(receivedAmount.invoiceAmountDue ?? 0, currency)}</span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Received Date</p>
                <p className="mt-1 font-medium text-foreground">{formatOptionalDate(receivedAmount.receivedDate)}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Recorded</p>
                <p className="mt-1 font-medium text-foreground">{formatDate(receivedAmount.createdAt)}</p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
