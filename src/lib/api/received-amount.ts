import { Types } from "mongoose";

import { getInvoiceGrossTotal } from "@/lib/api/invoice-totals";
import { InvoiceModel } from "@/models/Invoice";
import { ReceivedAmountModel } from "@/models/ReceivedAmount";

export async function getInvoiceReceivedTotal(invoiceId: string, excludeId?: string) {
  const match: Record<string, unknown> = { invoiceId: new Types.ObjectId(invoiceId) };
  if (excludeId) {
    match._id = { $ne: new Types.ObjectId(excludeId) };
  }

  const result = await ReceivedAmountModel.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  return result[0]?.total ?? 0;
}

export async function getInvoiceReceivedTotalsMap(projectId: string) {
  const rows = await ReceivedAmountModel.aggregate([
    { $match: { projectId: new Types.ObjectId(projectId) } },
    { $group: { _id: "$invoiceId", totalReceived: { $sum: "$amount" } } },
  ]);

  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row._id.toString(), row.totalReceived as number);
  }
  return map;
}

export async function validateReceivedAmount(invoiceId: string, amount: number, excludeId?: string) {
  const invoice = await InvoiceModel.findById(invoiceId).lean();
  if (!invoice) {
    return { valid: false as const, message: "Invoice not found." };
  }

  const existingTotal = await getInvoiceReceivedTotal(invoiceId, excludeId);
  const grossTotal = getInvoiceGrossTotal(invoice);
  const remaining = grossTotal - existingTotal;

  if (amount > remaining + 0.0001) {
    return {
      valid: false as const,
      message: `Payment exceeds invoice total. Maximum allowed: ${remaining.toFixed(2)}.`,
    };
  }

  return { valid: true as const, invoice };
}
