import { NextRequest } from "next/server";
import { Types } from "mongoose";

import { createAuditLog, getRequestIpAddress } from "@/lib/api/audit";
import { normalizeOptionalDate } from "@/lib/api/excel-export";
import { getInvoiceAmountDue, getInvoiceGrossTotal, normalizeInvoiceAmounts } from "@/lib/api/invoice-totals";
import { buildSortObject, parsePaginationParams } from "@/lib/api/pagination";
import { asPaginateResult } from "@/lib/api/paginate-result";
import { getInvoiceReceivedTotal, validateReceivedAmount } from "@/lib/api/received-amount";
import { fail, ok } from "@/lib/api/response";
import { withRouteGuard } from "@/lib/api/route-guard";
import { connectToDatabase } from "@/lib/db";
import { createReceivedAmountSchema } from "@/lib/validation/project";
import { InvoiceModel } from "@/models/Invoice";
import { ProjectModel } from "@/models/Project";
import { ReceivedAmountModel } from "@/models/ReceivedAmount";
import { AuthUser } from "@/types/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function serializeReceivedAmount(
  record: {
    _id: { toString(): string };
    projectId: { toString(): string };
    invoiceId: { toString(): string };
    amount: number;
    receivedDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
  },
  invoice?: {
    invoiceDate: Date;
    lineItems: Array<{ label: string }>;
    subtotal: number;
    vatAmount: number;
    total: number;
  } | null,
  amountReceived?: number,
) {
  const invoiceTotal = invoice ? getInvoiceGrossTotal(invoice) : 0;
  const received = amountReceived ?? 0;

  return {
    id: record._id.toString(),
    projectId: record.projectId.toString(),
    invoiceId: record.invoiceId.toString(),
    invoiceDate: invoice?.invoiceDate,
    invoiceLabel: invoice?.lineItems.map((item) => item.label).join(", "),
    invoiceTotal,
    amount: record.amount,
    receivedDate: normalizeOptionalDate(record.receivedDate),
    invoiceAmountReceived: received,
    invoiceAmountDue: invoice ? getInvoiceAmountDue(invoice, received) : 0,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

async function listProjectReceivedAmounts(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  await connectToDatabase();

  const project = await ProjectModel.findById(id).lean();
  if (!project) return fail("Project not found.", 404);

  const pagination = parsePaginationParams(request, { sortBy: "createdAt" });
  const invoiceId = request.nextUrl.searchParams.get("invoiceId");

  const query: Record<string, unknown> = { projectId: id };
  if (invoiceId) query.invoiceId = invoiceId;

  const result = asPaginateResult<{
    _id: { toString(): string };
    projectId: { toString(): string };
    invoiceId: { toString(): string };
    amount: number;
    receivedDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }>(
    await ReceivedAmountModel.paginate(query, {
      page: pagination.page,
      limit: pagination.limit,
      sort: buildSortObject(pagination.sortBy, pagination.sortOrder),
      lean: true,
    }),
  );

  const invoiceIds = [...new Set(result.docs.map((doc) => doc.invoiceId.toString()))];
  const invoices = await InvoiceModel.find({ _id: { $in: invoiceIds } }).lean();
  const invoiceMap = new Map(invoices.map((invoice) => [invoice._id.toString(), invoice]));

  const invoiceObjectIds = invoiceIds.map((invoiceId) => new Types.ObjectId(invoiceId));

  const receivedTotals = await ReceivedAmountModel.aggregate([
    { $match: { projectId: new Types.ObjectId(id), invoiceId: { $in: invoiceObjectIds } } },
    { $group: { _id: "$invoiceId", totalReceived: { $sum: "$amount" } } },
  ]);
  const receivedMap = new Map(receivedTotals.map((row) => [row._id.toString(), row.totalReceived as number]));

  return ok({
    receivedAmounts: result.docs.map((doc) =>
      serializeReceivedAmount(
        doc,
        invoiceMap.get(doc.invoiceId.toString()) ?? null,
        receivedMap.get(doc.invoiceId.toString()) ?? 0,
      ),
    ),
    pagination: {
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      totalDocs: result.totalDocs,
    },
  });
}

async function createProjectReceivedAmount(request: NextRequest, context: RouteContext, authUser: AuthUser) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = createReceivedAmountSchema.safeParse(body);

  if (!parsed.success) {
    return fail("Invalid received amount payload.", 400, parsed.error.flatten());
  }

  await connectToDatabase();

  const project = await ProjectModel.findById(id).lean();
  if (!project) return fail("Project not found.", 404);

  const invoice = await InvoiceModel.findOne({ _id: parsed.data.invoiceId, projectId: id }).lean();
  if (!invoice) return fail("Invoice not found for this project.", 404);

  const validation = await validateReceivedAmount(parsed.data.invoiceId, parsed.data.amount);
  if (!validation.valid) {
    return fail(validation.message, 400);
  }

  const record = await ReceivedAmountModel.create({
    projectId: id,
    invoiceId: parsed.data.invoiceId,
    amount: parsed.data.amount,
    receivedDate: normalizeOptionalDate(parsed.data.receivedDate ?? null),
    createdBy: authUser.id,
  });

  const amountReceived = await getInvoiceReceivedTotal(parsed.data.invoiceId);

  await createAuditLog({
    actor: authUser,
    action: "create",
    module: "manpowerSubcontract",
    entityType: "ReceivedAmount",
    entityId: record._id.toString(),
    changes: { after: { projectId: id, invoiceId: parsed.data.invoiceId, amount: parsed.data.amount } },
    ipAddress: getRequestIpAddress(request),
  });

  return ok({
    receivedAmount: serializeReceivedAmount(record, invoice ? normalizeInvoiceAmounts(invoice) : null, amountReceived),
  });
}

export const GET = withRouteGuard(listProjectReceivedAmounts, {
  requirePermission: { module: "manpowerSubcontract", action: "view" },
});

export const POST = withRouteGuard(createProjectReceivedAmount, {
  requirePermission: { module: "manpowerSubcontract", action: "create" },
});
