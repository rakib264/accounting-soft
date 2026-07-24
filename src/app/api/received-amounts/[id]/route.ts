import { NextRequest } from "next/server";

import { Types } from "mongoose";

import { createAuditLog, getRequestIpAddress } from "@/lib/api/audit";
import { normalizeOptionalDate } from "@/lib/api/excel-export";
import { getInvoiceAmountDue, getInvoiceGrossTotal } from "@/lib/api/invoice-totals";
import { getInvoiceReceivedTotal, validateReceivedAmount } from "@/lib/api/received-amount";
import { fail, ok } from "@/lib/api/response";
import { withRouteGuard } from "@/lib/api/route-guard";
import { connectToDatabase } from "@/lib/db";
import { updateReceivedAmountSchema } from "@/lib/validation/project";
import { InvoiceModel } from "@/models/Invoice";
import { ReceivedAmountModel } from "@/models/ReceivedAmount";
import { AuthUser } from "@/types/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function updateReceivedAmount(request: NextRequest, context: RouteContext, authUser: AuthUser) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = updateReceivedAmountSchema.safeParse(body);

  if (!parsed.success) {
    return fail("Invalid received amount payload.", 400, parsed.error.flatten());
  }

  await connectToDatabase();

  const record = await ReceivedAmountModel.findById(id);
  if (!record) return fail("Received amount not found.", 404);

  const before = {
    invoiceId: record.invoiceId.toString(),
    amount: record.amount,
    receivedDate: record.receivedDate,
  };

  const nextInvoiceId = parsed.data.invoiceId ?? record.invoiceId.toString();
  const nextAmount = parsed.data.amount ?? record.amount;

  if (parsed.data.invoiceId && parsed.data.invoiceId !== record.invoiceId.toString()) {
    const invoice = await InvoiceModel.findOne({ _id: parsed.data.invoiceId, projectId: record.projectId }).lean();
    if (!invoice) return fail("Invoice not found for this project.", 404);
  }

  const validation = await validateReceivedAmount(nextInvoiceId, nextAmount, id);
  if (!validation.valid) {
    return fail(validation.message, 400);
  }

  if (parsed.data.invoiceId) record.invoiceId = new Types.ObjectId(parsed.data.invoiceId);
  if (parsed.data.amount !== undefined) record.amount = parsed.data.amount;
  if (parsed.data.receivedDate !== undefined) {
    record.receivedDate = normalizeOptionalDate(parsed.data.receivedDate);
  }

  await record.save();

  const invoice = await InvoiceModel.findById(record.invoiceId).lean();
  const amountReceived = await getInvoiceReceivedTotal(record.invoiceId.toString());
  const grossTotal = invoice ? getInvoiceGrossTotal(invoice) : 0;

  await createAuditLog({
    actor: authUser,
    action: "update",
    module: "manpowerSubcontract",
    entityType: "ReceivedAmount",
    entityId: id,
    changes: {
      before,
      after: {
        invoiceId: record.invoiceId.toString(),
        amount: record.amount,
        receivedDate: record.receivedDate,
      },
    },
    ipAddress: getRequestIpAddress(request),
  });

  return ok({
    receivedAmount: {
      id: record._id.toString(),
      projectId: record.projectId.toString(),
      invoiceId: record.invoiceId.toString(),
      invoiceDate: invoice?.invoiceDate,
      invoiceLabel: invoice?.lineItems.map((item) => item.label).join(", "),
      invoiceTotal: grossTotal,
      amount: record.amount,
      receivedDate: normalizeOptionalDate(record.receivedDate),
      invoiceAmountReceived: amountReceived,
      invoiceAmountDue: invoice ? getInvoiceAmountDue(invoice, amountReceived) : 0,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    },
  });
}

async function deleteReceivedAmount(request: NextRequest, context: RouteContext, authUser: AuthUser) {
  const { id } = await context.params;
  await connectToDatabase();

  const record = await ReceivedAmountModel.findById(id);
  if (!record) return fail("Received amount not found.", 404);

  await ReceivedAmountModel.findByIdAndDelete(id);

  await createAuditLog({
    actor: authUser,
    action: "delete",
    module: "manpowerSubcontract",
    entityType: "ReceivedAmount",
    entityId: id,
    changes: { before: { amount: record.amount, invoiceId: record.invoiceId.toString() } },
    ipAddress: getRequestIpAddress(request),
  });

  return ok({ message: "Received amount deleted." });
}

export const PATCH = withRouteGuard(updateReceivedAmount, {
  requirePermission: { module: "manpowerSubcontract", action: "edit" },
});

export const DELETE = withRouteGuard(deleteReceivedAmount, {
  requirePermission: { module: "manpowerSubcontract", action: "delete" },
});
