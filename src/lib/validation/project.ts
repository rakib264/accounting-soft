import { z } from "zod";

function parseOptionalReceivedDate(value: unknown) {
  if (value === "" || value === null || value === undefined) return null;
  const date = new Date(value as string | number | Date);
  if (Number.isNaN(date.getTime()) || date.getFullYear() < 1971) return null;
  return date;
}

export const businessTypeSchema = z.enum(["manpower", "subcontract", "trade"]);

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Project name is required."),
  details: z.string().trim().min(1, "Project details are required."),
  imageUrl: z.string().optional(),
  businessType: businessTypeSchema,
});

export const updateProjectSchema = createProjectSchema.partial();

export const invoiceLineItemSchema = z.object({
  label: z.string().trim().min(1, "Label is required."),
  amount: z.coerce.number().min(0, "Amount must be zero or greater."),
});

export const createInvoiceSchema = z.object({
  lineItems: z.array(invoiceLineItemSchema).min(1, "At least one line item is required."),
  invoiceDate: z.coerce.date(),
  attachments: z.array(z.string()).optional(),
});

export const updateInvoiceSchema = createInvoiceSchema.partial();

export const expenseEntrySchema = z.object({
  label: z.string().trim().min(1, "Label is required."),
  amount: z.coerce.number().min(0, "Amount must be zero or greater."),
  details: z.string().trim().min(1, "Details are required."),
  date: z.coerce.date(),
  attachments: z.array(z.string()).optional(),
});

export const createExpenseSchema = z.object({
  entries: z.array(expenseEntrySchema).min(1, "At least one expense entry is required."),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const createReceivedAmountSchema = z.object({
  invoiceId: z.string().trim().min(1, "Invoice is required."),
  amount: z.coerce.number().positive("Amount must be greater than zero."),
  receivedDate: z.preprocess(parseOptionalReceivedDate, z.date().nullable().optional()),
});

export const updateReceivedAmountSchema = createReceivedAmountSchema.partial();

export const tradeTransactionSchema = z.object({
  date: z.coerce.date(),
  description: z.string().trim().min(1),
  debit: z.coerce.number().min(0).default(0),
  credit: z.coerce.number().min(0).default(0),
  balance: z.coerce.number(),
  reference: z.string().trim().optional(),
  rawExtractedData: z.record(z.string(), z.unknown()).optional(),
});

export const commitTradeSchema = z.object({
  sourceFile: z.string().trim().min(1),
  transactions: z.array(tradeTransactionSchema).min(1),
});
