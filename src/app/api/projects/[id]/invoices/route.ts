import { NextRequest } from "next/server";

import { createAuditLog, getRequestIpAddress } from "@/lib/api/audit";
import { buildSortObject, parsePaginationParams } from "@/lib/api/pagination";
import { asPaginateResult } from "@/lib/api/paginate-result";
import { fail, ok } from "@/lib/api/response";
import { withRouteGuard } from "@/lib/api/route-guard";
import { connectToDatabase } from "@/lib/db";
import { getInvoiceGrossTotal, getInvoiceAmountDue, normalizeInvoiceAmounts } from "@/lib/api/invoice-totals";
import { getInvoiceReceivedTotalsMap } from "@/lib/api/received-amount";
import { createInvoiceSchema } from "@/lib/validation/project";
import { InvoiceModel } from "@/models/Invoice";
import { ProjectModel } from "@/models/Project";
import { SettingsModel } from "@/models/Settings";
import { AuthUser } from "@/types/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function serializeInvoice(
  invoice: {
    _id: { toString(): string };
    projectId: { toString(): string };
    lineItems: Array<{ label: string; amount: number }>;
    invoiceDate: Date;
    vatPercent: number;
    vatAmount: number;
    subtotal: number;
    total: number;
    attachments: string[];
    createdAt: Date;
    updatedAt: Date;
  },
  amountReceived = 0,
) {
  const normalized = normalizeInvoiceAmounts(invoice);
  const grossTotal = normalized.total;

  return {
    id: invoice._id.toString(),
    projectId: invoice.projectId.toString(),
    lineItems: invoice.lineItems,
    invoiceDate: invoice.invoiceDate,
    vatPercent: invoice.vatPercent,
    vatAmount: invoice.vatAmount,
    subtotal: invoice.subtotal,
    total: grossTotal,
    amountReceived,
    amountDue: getInvoiceAmountDue(invoice, amountReceived),
    attachments: invoice.attachments,
    lineItemSummary: invoice.lineItems.map((item) => item.label).join(", "),
    createdAt: invoice.createdAt,
    updatedAt: invoice.updatedAt,
  };
}

async function listProjectInvoices(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  await connectToDatabase();

  const project = await ProjectModel.findById(id).lean();
  if (!project) return fail("Project not found.", 404);

  const pagination = parsePaginationParams(request, { sortBy: "invoiceDate" });

  const result = asPaginateResult<Parameters<typeof serializeInvoice>[0]>(
    await InvoiceModel.paginate(
      { projectId: id },
      {
        page: pagination.page,
        limit: pagination.limit,
        sort: buildSortObject(pagination.sortBy, pagination.sortOrder),
        lean: true,
      },
    ),
  );

  const docs = result.docs;
  const receivedMap = await getInvoiceReceivedTotalsMap(id);

  return ok({
    invoices: docs.map((invoice) => serializeInvoice(invoice, receivedMap.get(invoice._id.toString()) ?? 0)),
    pagination: {
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      totalDocs: result.totalDocs,
    },
  });
}

async function createProjectInvoice(request: NextRequest, context: RouteContext, authUser: AuthUser) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = createInvoiceSchema.safeParse(body);

  if (!parsed.success) {
    return fail("Invalid invoice payload.", 400, parsed.error.flatten());
  }

  await connectToDatabase();

  const project = await ProjectModel.findById(id).lean();
  if (!project) return fail("Project not found.", 404);

  const settings = await SettingsModel.findOne({ singletonKey: "global" }).lean();
  const vatPercent = settings?.vatPercent ?? 15;
  const subtotal = parsed.data.lineItems.reduce((sum, item) => sum + item.amount, 0);
  const vatAmount = (subtotal * vatPercent) / 100;
  const total = subtotal + vatAmount;

  const invoice = await InvoiceModel.create({
    projectId: id,
    lineItems: parsed.data.lineItems,
    invoiceDate: parsed.data.invoiceDate,
    vatPercent,
    vatAmount,
    subtotal,
    total,
    attachments: parsed.data.attachments ?? [],
    createdBy: authUser.id,
  });

  await createAuditLog({
    actor: authUser,
    action: "create",
    module: "manpowerSubcontract",
    entityType: "Invoice",
    entityId: invoice._id.toString(),
    changes: { after: { projectId: id, total } },
    ipAddress: getRequestIpAddress(request),
  });

  return ok({ invoice: serializeInvoice(invoice) });
}

export const GET = withRouteGuard(listProjectInvoices, {
  requirePermission: { module: "manpowerSubcontract", action: "view" },
});

export const POST = withRouteGuard(createProjectInvoice, {
  requirePermission: { module: "manpowerSubcontract", action: "create" },
});
