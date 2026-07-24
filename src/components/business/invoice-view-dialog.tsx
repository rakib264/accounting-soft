"use client";

import { AttachmentGallery } from "@/components/shared/attachment-gallery";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getInvoiceGrossTotal, getInvoiceAmountDue } from "@/lib/invoice-calculations";
import { formatCurrency, formatDate, formatOptionalDate } from "@/lib/format";
import { Invoice, useGetProjectReceivedAmountsQuery } from "@/store/api/business-api";

type InvoiceViewDialogProps = {
  invoice: Invoice | null;
  projectId?: string;
  currency?: string;
  onOpenChange: (open: boolean) => void;
};

export function InvoiceViewDialog({ invoice, projectId, currency = "SAR", onOpenChange }: InvoiceViewDialogProps) {
  const { data: receivedData } = useGetProjectReceivedAmountsQuery(
    { projectId: projectId ?? invoice?.projectId ?? "", invoiceId: invoice?.id, limit: 100, page: 1 },
    { skip: !invoice || !(projectId ?? invoice.projectId) },
  );

  const receivedEntries = receivedData?.data.receivedAmounts ?? [];
  const grossTotal = invoice ? getInvoiceGrossTotal(invoice) : 0;
  const amountReceived = invoice?.amountReceived ?? receivedEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const amountDue = invoice ? getInvoiceAmountDue(invoice, amountReceived) : 0;

  return (
    <Dialog open={Boolean(invoice)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invoice Details</DialogTitle>
        </DialogHeader>

        {invoice && (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Invoice Date</p>
                <p className="mt-1 text-sm font-medium text-foreground">{formatDate(invoice.invoiceDate)}</p>
              </div>
              {invoice.projectName && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Project</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{invoice.projectName}</p>
                </div>
              )}
            </div>

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Line Items</p>
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Label</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.lineItems.map((item, index) => (
                      <tr key={`${item.label}-${index}`} className="border-t border-border">
                        <td className="px-3 py-2 text-foreground">{item.label}</td>
                        <td className="px-3 py-2 text-right text-foreground">{formatCurrency(item.amount, currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-accent/30 p-4 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(invoice.subtotal, currency)}</span></div>
              <div className="flex justify-between"><span>VAT ({invoice.vatPercent}%)</span><span>{formatCurrency(invoice.vatAmount, currency)}</span></div>
              <div className="mt-2 flex justify-between font-semibold text-accent-foreground">
                <span>Total</span>
                <span>{formatCurrency(grossTotal, currency)}</span>
              </div>
              <div className="mt-2 flex justify-between text-muted-foreground">
                <span>Total Received on Invoice</span>
                <span>{formatCurrency(amountReceived, currency)}</span>
              </div>
              <div className="mt-2 flex justify-between font-medium">
                <span>Balance Due on Invoice</span>
                <span>{formatCurrency(amountDue, currency)}</span>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Received Amounts</p>
              {receivedEntries.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                  No received amounts recorded for this invoice yet.
                </p>
              ) : (
                <div className="overflow-hidden rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Amount</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Date</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Recorded</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receivedEntries.map((entry) => (
                        <tr key={entry.id} className="border-t border-border">
                          <td className="px-3 py-2 font-medium text-foreground">{formatCurrency(entry.amount, currency)}</td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {formatOptionalDate(entry.receivedDate)}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">{formatDate(entry.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Attachments</p>
              <AttachmentGallery urls={invoice.attachments} />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
