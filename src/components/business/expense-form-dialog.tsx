"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import { DatePicker } from "@/components/shared/date-picker";
import { EMPTY_FILES, EMPTY_URLS, FileUpload } from "@/components/shared/file-upload";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormField, fieldError, nestedFieldError } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { validateClientFiles } from "@/lib/file-validation-client";
import { showSuccess } from "@/lib/toast";
import { positiveAmount, trimmedRequired } from "@/lib/validation/common";
import { Expense, useCreateExpenseMutation, useUpdateExpenseMutation, useUploadFilesMutation } from "@/store/api/business-api";

const schema = z.object({
  entries: z
    .array(
      z.object({
        label: trimmedRequired("Label"),
        amount: positiveAmount,
        details: trimmedRequired("Details"),
        date: z.string().min(1, "Date is required."),
      }),
    )
    .min(1, "At least one expense entry is required."),
});

type FormValues = z.infer<typeof schema>;

type ExpenseFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  expense?: Expense;
  onSuccess?: () => void;
};

type EntryAttachments = {
  existing: string[];
  pending: File[];
};

export function ExpenseFormDialog({ open, onOpenChange, projectId, expense, onSuccess }: ExpenseFormDialogProps) {
  const [createExpense, { isLoading: creating }] = useCreateExpenseMutation();
  const [updateExpense, { isLoading: updating }] = useUpdateExpenseMutation();
  const [uploadFiles] = useUploadFilesMutation();
  const [entryAttachments, setEntryAttachments] = useState<Record<number, EntryAttachments>>({});
  const isEdit = Boolean(expense);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      entries: [{ label: "", amount: 0, details: "", date: new Date().toISOString().slice(0, 10) }],
    },
    mode: "onBlur",
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "entries" });
  const { errors, isSubmitting } = form.formState;
  const loading = creating || updating || isSubmitting;

  useEffect(() => {
    if (!open) return;

    if (expense) {
      form.reset({
        entries: expense.entries.map((entry) => ({
          label: entry.label,
          amount: entry.amount,
          details: entry.details,
          date: entry.date.slice(0, 10),
        })),
      });
      setEntryAttachments(
        Object.fromEntries(
          expense.entries.map((entry, index) => [index, { existing: entry.attachments ?? [], pending: [] }]),
        ),
      );
    } else {
      form.reset({
        entries: [{ label: "", amount: 0, details: "", date: new Date().toISOString().slice(0, 10) }],
      });
      setEntryAttachments({ 0: { existing: [], pending: [] } });
    }
  }, [expense, open, form]);

  function updateEntryAttachments(index: number, next: EntryAttachments) {
    setEntryAttachments((current) => ({ ...current, [index]: next }));
  }

  async function onSubmit(values: FormValues) {
    try {
      const entries = await Promise.all(
        values.entries.map(async (entry, index) => {
          const attachmentsState = entryAttachments[index] ?? { existing: [], pending: [] };
          const { existing, pending } = attachmentsState;

          if (pending.length > 0) {
            const validation = validateClientFiles(pending);
            if (!validation.valid) {
              throw new Error(validation.message);
            }
          }

          let attachments = [...existing];

          if (pending.length > 0) {
            const upload = await uploadFiles({ files: pending, folder: `expenses/${projectId}` }).unwrap();
            attachments = [...attachments, ...upload.data.urls];
          }

          return { ...entry, attachments };
        }),
      );

      if (isEdit && expense) {
        await updateExpense({ id: expense.id, entries }).unwrap();
        showSuccess("Expense updated successfully.");
      } else {
        await createExpense({ projectId, entries }).unwrap();
        showSuccess("Expense created successfully.");
      }

      form.reset();
      setEntryAttachments({});
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      if (error instanceof Error && !("status" in error)) {
        form.setError("root", { message: error.message });
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Expense" : "Add Expense"}</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Expense Entries</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                append({ label: "", amount: 0, details: "", date: new Date().toISOString().slice(0, 10) });
                setEntryAttachments((current) => ({
                  ...current,
                  [fields.length]: { existing: [], pending: [] },
                }));
              }}
            >
              <Plus className="h-4 w-4" /> Add Entry
            </Button>
          </div>

          {errors.entries?.message && <p className="text-sm text-destructive">{errors.entries.message}</p>}
          {errors.root?.message && <p className="text-sm text-destructive">{errors.root.message}</p>}

          {fields.map((field, index) => (
            <div key={field.id} className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <FormField label="Label" required error={nestedFieldError(errors as Record<string, unknown>, `entries.${index}.label`)}>
                  <Input {...form.register(`entries.${index}.label`)} />
                </FormField>
                <FormField label="Amount" required error={nestedFieldError(errors as Record<string, unknown>, `entries.${index}.amount`)}>
                  <Input type="number" step="0.01" {...form.register(`entries.${index}.amount`, { valueAsNumber: true })} />
                </FormField>
              </div>
              <FormField label="Details" required error={nestedFieldError(errors as Record<string, unknown>, `entries.${index}.details`)}>
                <Textarea {...form.register(`entries.${index}.details`)} />
              </FormField>
              <div className="grid gap-3 md:grid-cols-2">
                <FormField label="Date" required error={nestedFieldError(errors as Record<string, unknown>, `entries.${index}.date`)}>
                  <Controller
                    control={form.control}
                    name={`entries.${index}.date`}
                    render={({ field: dateField }) => (
                      <DatePicker value={dateField.value} onChange={dateField.onChange} disabled={loading} />
                    )}
                  />
                </FormField>
                <FormField label="Attachments" hint="Optional. Up to 10MB each.">
                  <FileUpload
                    files={entryAttachments[index]?.pending ?? EMPTY_FILES}
                    onFilesChange={(pending) =>
                      updateEntryAttachments(index, {
                        existing: entryAttachments[index]?.existing ?? EMPTY_URLS,
                        pending,
                      })
                    }
                    existingUrls={entryAttachments[index]?.existing ?? EMPTY_URLS}
                    onExistingUrlsChange={(existing) =>
                      updateEntryAttachments(index, {
                        existing,
                        pending: entryAttachments[index]?.pending ?? EMPTY_FILES,
                      })
                    }
                    validateFiles={validateClientFiles}
                    accept="image/*,.pdf,.doc,.docx"
                    disabled={loading}
                  />
                </FormField>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)} disabled={fields.length === 1}>
                <Trash2 className="mr-2 h-4 w-4" /> Remove entry
              </Button>
            </div>
          ))}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
            <SubmitButton loading={loading} loadingText={isEdit ? "Saving..." : "Creating..."}>
              {isEdit ? "Save changes" : "Create Expense"}
            </SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
