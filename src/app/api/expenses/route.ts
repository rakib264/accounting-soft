import { NextRequest } from "next/server";
import { EmptyRouteContext } from "@/lib/api/route-context";

import { buildSortObject, parsePaginationParams } from "@/lib/api/pagination";
import { asPaginateResult } from "@/lib/api/paginate-result";
import { ok } from "@/lib/api/response";
import { withRouteGuard } from "@/lib/api/route-guard";
import { connectToDatabase } from "@/lib/db";
import { ExpenseModel } from "@/models/Expense";
import { ProjectModel } from "@/models/Project";

type RouteContext = EmptyRouteContext;

async function listAllExpenses(request: NextRequest) {
  await connectToDatabase();

  const searchParams = request.nextUrl.searchParams;
  const businessType = searchParams.get("businessType");
  const projectId = searchParams.get("projectId");
  const pagination = parsePaginationParams(request);

  const query: Record<string, unknown> = {};

  if (projectId) {
    query.projectId = projectId;
  } else if (businessType === "manpower" || businessType === "subcontract") {
    const projects = await ProjectModel.find({ businessType }).select("_id").lean();
    query.projectId = { $in: projects.map((p) => p._id) };
  }

  const result = asPaginateResult<{
    _id: { toString(): string };
    projectId: { toString(): string };
    entries: Array<{ label: string; amount: number; details: string; date: Date; attachments: string[] }>;
    createdAt: Date;
  }>(
    await ExpenseModel.paginate(query, {
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
    expenses: result.docs.map((expense) => ({
      id: expense._id.toString(),
      projectId: expense.projectId.toString(),
      projectName: projectMap.get(expense.projectId.toString()) ?? "Unknown",
      entries: expense.entries,
      totalAmount: expense.entries.reduce((sum, e) => sum + e.amount, 0),
      labelSummary: expense.entries.map((e) => e.label).join(", "),
      createdAt: expense.createdAt,
    })),
    pagination: {
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      totalDocs: result.totalDocs,
    },
  });
}

export const GET = withRouteGuard(listAllExpenses, {
  requirePermission: { module: "manpowerSubcontract", action: "view" },
});
