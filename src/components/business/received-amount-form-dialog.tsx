"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { DatePicker } from "@/components/shared/date-picker";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormField, fieldError } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { getInvoiceGrossTotal, getInvoiceAmountDue } from "@/lib/invoice-calculations";
import { formatCurrency, formatDate } from "@/lib/format";
import { showSuccess, showWarning } from "@/lib/toast";
import { positiveAmount } from "@/lib/validation/common";
import {
  ReceivedAmount,
  useCreateReceivedAmountMutation,
  useGetProjectInvoicesQuery,
  useGetProjectReceivedAmountsQuery,
  useUpdateReceivedAmountMutation,
} from "@/store/api/business-api";
import { useGetInvoiceConfigQuery } from "@/store/api/settings-api";

const schema = z.object({
  invoiceId: z.string().min(1, "Invoice is required."),
  amount: positiveAmount,
  receivedDate: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type ReceivedAmountFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  receivedAmount?: ReceivedAmount | null;
  onSuccess?: () => void;
};

export function ReceivedAmountFormDialog({
  open,
  onOpenChange,
  projectId,
  receivedAmount,
  onSuccess,
}: ReceivedAmountFormDialogProps) {
  const { data: configData } = useGetInvoiceConfigQuery();
  const { data: invoicesData } = useGetProjectInvoicesQuery({ projectId, limit: 100, page: 1 }, { skip: !open });
  const { data: receivedData } = useGetProjectReceivedAmountsQuery({ projectId, limit: 500, page: 1 }, { skip: !open });
  const [createReceivedAmount, { isLoading: creating }] = useCreateReceivedAmountMutation();
  const [updateReceivedAmount, { isLoading: updating }] = useUpdateReceivedAmountMutation();

  const currency = configData?.data.currency ?? "SAR";
  const invoices = invoicesData?.data.invoices ?? [];
  const allReceived = receivedData?.data.receivedAmounts ?? [];

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      invoiceId: "",
      amount: 0,
      receivedDate: "",
    },
  });

  const selectedInvoiceId = form.watch("invoiceId");
  const selectedInvoice = invoices.find((invoice) => invoice.id === selectedInvoiceId);

  const remainingAmount = useMemo(() => {
    if (!selectedInvoice) return 0;
    const receivedForInvoice = allReceived
      .filter((entry) => entry.invoiceId === selectedInvoice.id && entry.id !== receivedAmount?.id)
      .reduce((sum, entry) => sum + entry.amount, 0);
    return Math.max(0, getInvoiceAmountDue(selectedInvoice, receivedForInvoice));
  }, [allReceived, receivedAmount?.id, selectedInvoice]);

  useEffect(() => {
    if (!open) return;

    if (receivedAmount) {
      form.reset({
        invoiceId: receivedAmount.invoiceId,
        amount: receivedAmount.amount,
        receivedDate: receivedAmount.receivedDate ? receivedAmount.receivedDate.slice(0, 10) : "",
      });
    } else {
      form.reset({
        invoiceId: invoices[0]?.id ?? "",
        amount: 0,
        receivedDate: "",
      });
    }
  }, [form, invoices, open, receivedAmount]);

  async function onSubmit(values: FormValues) {
    if (values.amount > remainingAmount) {
      showWarning(`Payment exceeds invoice total. Maximum allowed: ${formatCurrency(remainingAmount, currency)}.`);
      return;
    }

    const payload = {
      invoiceId: values.invoiceId,
      amount: values.amount,
      receivedDate: values.receivedDate ? values.receivedDate : null,
    };

    try {
      if (receivedAmount) {
        await updateReceivedAmount({ id: receivedAmount.id, ...payload }).unwrap();
        showSuccess("Received amount updated successfully.");
      } else {
        await createReceivedAmount({ projectId, ...payload }).unwrap();
        showSuccess("Received amount recorded successfully.");
      }
      onOpenChange(false);
      onSuccess?.();
    } catch {
      /* RTK handles error toast */
    }
  }

  const loading = creating || updating || form.formState.isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{receivedAmount ? "Edit Received Amount" : "Add Received Amount"}</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField label="Invoice" required error={fieldError(form.formState.errors, "invoiceId")}>
            <Controller
              control={form.control}
              name="invoiceId"
              render={({ field }) => (
                <Select {...field} disabled={invoices.length === 0}>
                  {invoices.length === 0 ? (
                    <option value="">No invoices available</option>
                  ) : (
                    invoices.map((invoice) => (
                      <option key={invoice.id} value={invoice.id}>
                        {formatDate(invoice.invoiceDate)} — {invoice.lineItemSummary} — {formatCurrency(getInvoiceGrossTotal(invoice), currency)}
                      </option>
                    ))
                  )}
                </Select>
              )}
            />
          </FormField>

          {selectedInvoice && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Invoice total</span>
                <span className="font-medium">{formatCurrency(getInvoiceGrossTotal(selectedInvoice), currency)}</span>
              </div>
              <div className="mt-1 flex justify-between gap-3">
                <span className="text-muted-foreground">Remaining due</span>
                <span className="font-semibold text-primary">{formatCurrency(remainingAmount, currency)}</span>
              </div>
            </div>
          )}

          <FormField label={`Received Amount (${currency})`} required error={fieldError(form.formState.errors, "amount")}>
            <Input type="number" min="0" step="0.01" {...form.register("amount", { valueAsNumber: true })} />
          </FormField>

          <FormField label="Received Date" hint="Optional">
            <Controller
              control={form.control}
              name="receivedDate"
              render={({ field }) => (
                <DatePicker value={field.value ?? ""} onChange={field.onChange} placeholder="No date selected" />
              )}
            />
          </FormField>

          <SubmitButton loading={loading} disabled={invoices.length === 0}>
            {receivedAmount ? "Update Received Amount" : "Save Received Amount"}
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
