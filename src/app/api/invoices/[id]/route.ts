import { NextRequest } from "next/server";

import { createAuditLog, getRequestIpAddress } from "@/lib/api/audit";
import { buildSortObject, parsePaginationParams } from "@/lib/api/pagination";
import { fail, ok } from "@/lib/api/response";
import { withRouteGuard } from "@/lib/api/route-guard";
import { connectToDatabase } from "@/lib/db";
import { updateInvoiceSchema } from "@/lib/validation/project";
import { InvoiceModel } from "@/models/Invoice";
import { SettingsModel } from "@/models/Settings";
import { AuthUser } from "@/types/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function updateInvoice(request: NextRequest, context: RouteContext, authUser: AuthUser) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = updateInvoiceSchema.safeParse(body);

  if (!parsed.success) {
    return fail("Invalid invoice payload.", 400, parsed.error.flatten());
  }

  await connectToDatabase();

  const invoice = await InvoiceModel.findById(id);
  if (!invoice) return fail("Invoice not found.", 404);

  const before = {
    lineItems: invoice.lineItems,
    invoiceDate: invoice.invoiceDate,
    total: invoice.total,
  };

  if (parsed.data.lineItems) invoice.lineItems = parsed.data.lineItems;
  if (parsed.data.invoiceDate) invoice.invoiceDate = parsed.data.invoiceDate;
  if (parsed.data.attachments) invoice.attachments = parsed.data.attachments;

  if (parsed.data.lineItems) {
    const settings = await SettingsModel.findOne({ singletonKey: "global" }).lean();
    const vatPercent = settings?.vatPercent ?? 15;
    const subtotal = invoice.lineItems.reduce((sum, item) => sum + item.amount, 0);
    invoice.vatPercent = vatPercent;
    invoice.vatAmount = (subtotal * vatPercent) / 100;
    invoice.subtotal = subtotal;
    invoice.total = subtotal;
  }

  await invoice.save();

  await createAuditLog({
    actor: authUser,
    action: "update",
    module: "manpowerSubcontract",
    entityType: "Invoice",
    entityId: id,
    changes: { before, after: { total: invoice.total } },
    ipAddress: getRequestIpAddress(request),
  });

  return ok({
    invoice: {
      id: invoice._id.toString(),
      projectId: invoice.projectId.toString(),
      lineItems: invoice.lineItems,
      invoiceDate: invoice.invoiceDate,
      vatPercent: invoice.vatPercent,
      vatAmount: invoice.vatAmount,
      subtotal: invoice.subtotal,
      total: invoice.total,
      attachments: invoice.attachments,
    },
  });
}

async function deleteInvoice(request: NextRequest, context: RouteContext, authUser: AuthUser) {
  const { id } = await context.params;
  await connectToDatabase();

  const invoice = await InvoiceModel.findById(id);
  if (!invoice) return fail("Invoice not found.", 404);

  await InvoiceModel.findByIdAndDelete(id);

  await createAuditLog({
    actor: authUser,
    action: "delete",
    module: "manpowerSubcontract",
    entityType: "Invoice",
    entityId: id,
    changes: { before: { total: invoice.total } },
    ipAddress: getRequestIpAddress(request),
  });

  return ok({ message: "Invoice deleted." });
}

export const PATCH = withRouteGuard(updateInvoice, {
  requirePermission: { module: "manpowerSubcontract", action: "edit" },
});

export const DELETE = withRouteGuard(deleteInvoice, {
  requirePermission: { module: "manpowerSubcontract", action: "delete" },
});
