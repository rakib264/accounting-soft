import { z } from "zod";

export const updateSettingsSchema = z.object({
  vatPercent: z.number().min(0).max(100),
  currency: z.string().trim().min(2).max(10),
  invoiceLabels: z.array(z.string().trim().min(1)).min(1),
});
