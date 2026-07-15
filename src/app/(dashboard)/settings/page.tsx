"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import { PermissionGate } from "@/components/auth/permission-gate";
import { ThemeSwitcher } from "@/components/shared/theme-switcher";
import { LoadingBlock, PageHeader } from "@/components/shared/page-elements";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, fieldError, nestedFieldError } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { trimmedRequired } from "@/lib/validation/common";
import { showSuccess } from "@/lib/toast";
import { useGetSettingsQuery, useUpdateSettingsMutation } from "@/store/api/settings-api";

const schema = z.object({
  vatPercent: z
    .number({ error: "VAT must be a number." })
    .min(0, "VAT must be zero or greater.")
    .max(100, "VAT cannot exceed 100%."),
  currency: z
    .string()
    .transform((value) => value.trim())
    .pipe(z.string().min(1, "Currency is required.").max(6, "Currency code is too long.")),
  invoiceLabels: z
    .array(z.object({ value: trimmedRequired("Label") }))
    .min(1, "At least one invoice label is required."),
});

type FormValues = z.infer<typeof schema>;

function SettingsPageContent() {
  const { data, isLoading } = useGetSettingsQuery();
  const [updateSettings, { isLoading: saving }] = useUpdateSettingsMutation();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: data?.data.settings
      ? {
          vatPercent: data.data.settings.vatPercent,
          currency: data.data.settings.currency,
          invoiceLabels: data.data.settings.invoiceLabels.map((value) => ({ value })),
        }
      : undefined,
    mode: "onBlur",
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "invoiceLabels" });
  const { errors, isSubmitting } = form.formState;
  const loading = saving || isSubmitting;

  async function onSubmit(values: FormValues) {
    try {
      await updateSettings({
        vatPercent: values.vatPercent,
        currency: values.currency,
        invoiceLabels: values.invoiceLabels.map((item) => item.value),
      }).unwrap();
      showSuccess("Settings updated successfully.");
    } catch {
      /* Keep form data on error */
    }
  }

  if (isLoading) return <LoadingBlock />;

  return (
    <div>
      <PageHeader title="Settings" description="Global VAT, currency, invoice labels, and appearance." />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Choose a shadcn theme for your organization. Green is active by default; other themes are ready for client preference.
          </p>
          <ThemeSwitcher />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Global Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="VAT Percentage" htmlFor="vatPercent" required error={fieldError(errors, "vatPercent")}>
                <Input id="vatPercent" type="number" step="0.01" {...form.register("vatPercent", { valueAsNumber: true })} />
              </FormField>
              <FormField label="Default Currency" htmlFor="currency" required error={fieldError(errors, "currency")}>
                <Input id="currency" {...form.register("currency")} />
              </FormField>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Invoice Amount Labels</span>
                <Button type="button" size="sm" variant="outline" onClick={() => append({ value: "" })}>
                  <Plus className="h-4 w-4" /> Add Label
                </Button>
              </div>
              {errors.invoiceLabels?.message && <p className="text-sm text-destructive">{errors.invoiceLabels.message}</p>}
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <FormField
                    label={`Label ${index + 1}`}
                    required
                    error={nestedFieldError(errors as Record<string, unknown>, `invoiceLabels.${index}.value`)}
                    className="flex-1"
                  >
                    <Input {...form.register(`invoiceLabels.${index}.value`)} />
                  </FormField>
                  <div className="flex items-end">
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length === 1}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <SubmitButton loading={loading} loadingText="Saving...">
              Save Settings
            </SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <PermissionGate module="settings" action="view">
      <SettingsPageContent />
    </PermissionGate>
  );
}
