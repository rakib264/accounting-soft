import { NextRequest } from "next/server";
import { Types } from "mongoose";

import { normalizeOptionalDate } from "@/lib/api/excel-export";
import { getInvoiceAmountDue, getInvoiceGrossTotal } from "@/lib/api/invoice-totals";
import { buildSortObject, parsePaginationParams } from "@/lib/api/pagination";
import { asPaginateResult } from "@/lib/api/paginate-result";
import { ok } from "@/lib/api/response";
import { withRouteGuard } from "@/lib/api/route-guard";
import { connectToDatabase } from "@/lib/db";
import { InvoiceModel } from "@/models/Invoice";
import { ProjectModel } from "@/models/Project";
import { ReceivedAmountModel } from "@/models/ReceivedAmount";

async function listAllReceivedAmounts(request: NextRequest) {
  await connectToDatabase();

  const searchParams = request.nextUrl.searchParams;
  const businessType = searchParams.get("businessType");
  const projectId = searchParams.get("projectId");
  const invoiceId = searchParams.get("invoiceId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const pagination = parsePaginationParams(request, { sortBy: "createdAt" });

  const query: Record<string, unknown> = {};

  if (projectId) {
    query.projectId = projectId;
  } else if (businessType === "manpower" || businessType === "subcontract" || businessType === "trade") {
    const projects = await ProjectModel.find({ businessType }).select("_id").lean();
    query.projectId = { $in: projects.map((project) => project._id) };
  }

  if (invoiceId) {
    query.invoiceId = invoiceId;
  }

  if (from || to) {
    query.receivedDate = {
      ...(from ? { $gte: new Date(from) } : {}),
      ...(to ? { $lte: new Date(to) } : {}),
    };
  }

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

  const docs = result.docs;
  const projectIds = [...new Set(docs.map((doc) => doc.projectId.toString()))];
  const invoiceIds = [...new Set(docs.map((doc) => doc.invoiceId.toString()))];

  const [projects, invoices, receivedTotals] = await Promise.all([
    ProjectModel.find({ _id: { $in: projectIds } }).select("name businessType").lean(),
    InvoiceModel.find({ _id: { $in: invoiceIds } }).lean(),
    invoiceIds.length > 0
      ? ReceivedAmountModel.aggregate([
          {
            $match: {
              invoiceId: { $in: invoiceIds.map((id) => new Types.ObjectId(id)) },
            },
          },
          {
            $group: {
              _id: "$invoiceId",
              totalReceived: { $sum: "$amount" },
            },
          },
        ])
      : [],
  ]);

  const projectMap = new Map(projects.map((project) => [project._id.toString(), project]));
  const invoiceMap = new Map(invoices.map((invoice) => [invoice._id.toString(), invoice]));
  const receivedMap = new Map(receivedTotals.map((row) => [row._id.toString(), row.totalReceived as number]));

  return ok({
    receivedAmounts: docs.map((record) => {
      const project = projectMap.get(record.projectId.toString());
      const invoice = invoiceMap.get(record.invoiceId.toString());
      const amountReceived = receivedMap.get(record.invoiceId.toString()) ?? 0;
      const invoiceTotal = invoice ? getInvoiceGrossTotal(invoice) : 0;

      return {
        id: record._id.toString(),
        projectId: record.projectId.toString(),
        projectName: project?.name ?? "Unknown",
        businessType: project?.businessType,
        invoiceId: record.invoiceId.toString(),
        invoiceDate: invoice?.invoiceDate,
        invoiceLabel: invoice?.lineItems.map((item) => item.label).join(", "),
        invoiceTotal,
        amount: record.amount,
        receivedDate: normalizeOptionalDate(record.receivedDate),
        invoiceAmountReceived: amountReceived,
        invoiceAmountDue: invoice ? getInvoiceAmountDue(invoice, amountReceived) : 0,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      };
    }),
    pagination: {
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      totalDocs: result.totalDocs,
    },
  });
}

export const GET = withRouteGuard(listAllReceivedAmounts, {
  requirePermission: { module: "manpowerSubcontract", action: "view" },
});
