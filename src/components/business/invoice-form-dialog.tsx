"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import { DatePicker } from "@/components/shared/date-picker";
import { FileUpload } from "@/components/shared/file-upload";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormField, fieldError, nestedFieldError } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { validateClientFiles } from "@/lib/file-validation-client";
import { showSuccess } from "@/lib/toast";
import { positiveAmount, trimmedRequired } from "@/lib/validation/common";
import { Invoice, useCreateInvoiceMutation, useUpdateInvoiceMutation, useUploadFilesMutation } from "@/store/api/business-api";
import { useGetInvoiceConfigQuery } from "@/store/api/settings-api";

const schema = z.object({
  invoiceDate: z.string().min(1, "Invoice date is required."),
  lineItems: z
    .array(
      z.object({
        label: trimmedRequired("Label"),
        amount: positiveAmount,
      }),
    )
    .min(1, "At least one line item is required."),
});

type FormValues = z.infer<typeof schema>;

type InvoiceFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  invoice?: Invoice;
  onSuccess?: () => void;
};

export function InvoiceFormDialog({ open, onOpenChange, projectId, invoice, onSuccess }: InvoiceFormDialogProps) {
  const { data: configData } = useGetInvoiceConfigQuery();
  const [createInvoice, { isLoading: creating }] = useCreateInvoiceMutation();
  const [updateInvoice, { isLoading: updating }] = useUpdateInvoiceMutation();
  const [uploadFiles] = useUploadFilesMutation();
  const [fileError, setFileError] = useState<string>();
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<string[]>([]);

  const config = configData?.data;
  const vatPercent = config?.vatPercent ?? 15;
  const currency = config?.currency ?? "SAR";
  const isEdit = Boolean(invoice);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      invoiceDate: new Date().toISOString().slice(0, 10),
      lineItems: [{ label: "", amount: 0 }],
    },
    mode: "onBlur",
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "lineItems" });
  const lineItems = form.watch("lineItems");
  const { errors, isSubmitting } = form.formState;
  const subtotal = lineItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const vatAmount = (subtotal * vatPercent) / 100;
  const total = subtotal + vatAmount;
  const loading = creating || updating || isSubmitting;

  useEffect(() => {
    if (!open) return;

    if (invoice) {
      form.reset({
        invoiceDate: invoice.invoiceDate.slice(0, 10),
        lineItems: invoice.lineItems,
      });
    } else {
      form.reset({
        invoiceDate: new Date().toISOString().slice(0, 10),
        lineItems: [{ label: config?.invoiceLabels[0] ?? "", amount: 0 }],
      });
    }
    setFileError(undefined);
    setPendingFiles([]);
    setExistingAttachments(invoice?.attachments ?? []);
  }, [invoice, open, form, config?.invoiceLabels]);

  async function onSubmit(values: FormValues) {
    setFileError(undefined);

    if (pendingFiles.length > 0) {
      const validation = validateClientFiles(pendingFiles);
      if (!validation.valid) {
        setFileError(validation.message);
        return;
      }
    }

    try {
      let attachments = [...existingAttachments];

      if (pendingFiles.length > 0) {
        const upload = await uploadFiles({ files: pendingFiles, folder: `invoices/${projectId}` }).unwrap();
        attachments = [...attachments, ...upload.data.urls];
      }

      if (isEdit && invoice) {
        await updateInvoice({
          id: invoice.id,
          lineItems: values.lineItems,
          invoiceDate: values.invoiceDate,
          attachments,
        }).unwrap();
        showSuccess("Invoice updated successfully.");
      } else {
        await createInvoice({
          projectId,
          lineItems: values.lineItems,
          invoiceDate: values.invoiceDate,
          attachments,
        }).unwrap();
        showSuccess("Invoice created successfully.");
      }

      form.reset();
      setPendingFiles([]);
      setExistingAttachments([]);
      onOpenChange(false);
      onSuccess?.();
    } catch {
      // Keep modal open on error
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Invoice" : "Add Invoice"}</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FormField label="Invoice Date" htmlFor="invoiceDate" required error={fieldError(errors, "invoiceDate")}>
            <Controller
              control={form.control}
              name="invoiceDate"
              render={({ field }) => (
                <DatePicker id="invoiceDate" value={field.value} onChange={field.onChange} disabled={loading} />
              )}
            />
          </FormField>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Line Items ({currency})</span>
              <Button type="button" size="sm" variant="outline" onClick={() => append({ label: "", amount: 0 })}>
                <Plus className="h-4 w-4" /> Add Line
              </Button>
            </div>

            {errors.lineItems?.message && (
              <p className="text-sm text-destructive" role="alert">
                {errors.lineItems.message}
              </p>
            )}

            {fields.map((field, index) => (
              <div key={field.id} className="grid gap-2 rounded-lg border border-border bg-muted/30 p-3 md:grid-cols-[1fr_140px_auto]">
                <FormField
                  label={`Label ${index + 1}`}
                  htmlFor={`lineItems.${index}.label`}
                  required
                  error={nestedFieldError(errors as Record<string, unknown>, `lineItems.${index}.label`)}
                  className="md:col-span-1"
                >
                  <Input list="invoice-labels" id={`lineItems.${index}.label`} {...form.register(`lineItems.${index}.label`)} />
                </FormField>
                <FormField
                  label="Amount"
                  htmlFor={`lineItems.${index}.amount`}
                  required
                  error={nestedFieldError(errors as Record<string, unknown>, `lineItems.${index}.amount`)}
                >
                  <Input type="number" step="0.01" id={`lineItems.${index}.amount`} {...form.register(`lineItems.${index}.amount`, { valueAsNumber: true })} />
                </FormField>
                <div className="flex items-end">
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length === 1} aria-label="Remove line item">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <datalist id="invoice-labels">
              {config?.invoiceLabels.map((label) => (
                <option key={label} value={label} />
              ))}
            </datalist>
          </div>

          <div className="rounded-lg border border-border bg-accent/40 p-4 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{subtotal.toFixed(2)} {currency}</span></div>
            <div className="flex justify-between"><span>VAT ({vatPercent}%)</span><span>{vatAmount.toFixed(2)} {currency}</span></div>
            <div className="mt-2 flex justify-between font-semibold text-accent-foreground"><span>Total</span><span>{total.toFixed(2)} {currency}</span></div>
          </div>

          <FormField label="Attachments" error={fileError} hint="Optional. Images, PDF, or DOC up to 10MB each.">
            <FileUpload
              files={pendingFiles}
              onFilesChange={(files) => {
                setPendingFiles(files);
                setFileError(undefined);
              }}
              existingUrls={existingAttachments}
              onExistingUrlsChange={setExistingAttachments}
              validateFiles={validateClientFiles}
              onValidationError={setFileError}
              error={fileError}
              accept="image/*,.pdf,.doc,.docx"
              disabled={loading}
            />
          </FormField>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
            <SubmitButton loading={loading} loadingText={isEdit ? "Saving..." : "Creating..."}>
              {isEdit ? "Save changes" : "Create Invoice"}
            </SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
