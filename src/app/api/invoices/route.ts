import { NextRequest } from "next/server";
import { EmptyRouteContext } from "@/lib/api/route-context";

import { buildSortObject, parsePaginationParams } from "@/lib/api/pagination";
import { asPaginateResult } from "@/lib/api/paginate-result";
import { ok } from "@/lib/api/response";
import { withRouteGuard } from "@/lib/api/route-guard";
import { connectToDatabase } from "@/lib/db";
import { InvoiceModel } from "@/models/Invoice";
import { ProjectModel } from "@/models/Project";

type RouteContext = EmptyRouteContext;

async function listAllInvoices(request: NextRequest) {
  await connectToDatabase();

  const searchParams = request.nextUrl.searchParams;
  const businessType = searchParams.get("businessType");
  const projectId = searchParams.get("projectId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const pagination = parsePaginationParams(request, { sortBy: "invoiceDate" });

  const query: Record<string, unknown> = {};

  if (projectId) {
    query.projectId = projectId;
  } else if (businessType === "manpower" || businessType === "subcontract") {
    const projects = await ProjectModel.find({ businessType }).select("_id").lean();
    query.projectId = { $in: projects.map((p) => p._id) };
  }

  if (from || to) {
    query.invoiceDate = {
      ...(from ? { $gte: new Date(from) } : {}),
      ...(to ? { $lte: new Date(to) } : {}),
    };
  }

  const result = asPaginateResult<{
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
  }>(
    await InvoiceModel.paginate(query, {
      page: pagination.page,
      limit: pagination.limit,
      sort: buildSortObject(pagination.sortBy, pagination.sortOrder),
      lean: true,
    }),
  );

  const projectIds = [...new Set(result.docs.map((d) => d.projectId.toString()))];
  const projects = await ProjectModel.find({ _id: { $in: projectIds } }).lean();
  const projectMap = new Map(projects.map((p) => [p._id.toString(), p.name]));

  return ok({
    invoices: result.docs.map((invoice) => ({
      id: invoice._id.toString(),
      projectId: invoice.projectId.toString(),
      projectName: projectMap.get(invoice.projectId.toString()) ?? "Unknown",
      lineItems: invoice.lineItems,
      lineItemSummary: invoice.lineItems.map((item) => item.label).join(", "),
      invoiceDate: invoice.invoiceDate,
      vatPercent: invoice.vatPercent,
      vatAmount: invoice.vatAmount,
      subtotal: invoice.subtotal,
      total: invoice.total,
      attachments: invoice.attachments,
      createdAt: invoice.createdAt,
    })),
    pagination: {
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      totalDocs: result.totalDocs,
    },
  });
}

export const GET = withRouteGuard(listAllInvoices, {
  requirePermission: { module: "manpowerSubcontract", action: "view" },
});
