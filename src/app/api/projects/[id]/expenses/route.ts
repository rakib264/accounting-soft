import { NextRequest } from "next/server";

import { createAuditLog, getRequestIpAddress } from "@/lib/api/audit";
import { buildSortObject, parsePaginationParams } from "@/lib/api/pagination";
import { asPaginateResult } from "@/lib/api/paginate-result";
import { fail, ok } from "@/lib/api/response";
import { withRouteGuard } from "@/lib/api/route-guard";
import { connectToDatabase } from "@/lib/db";
import { createExpenseSchema } from "@/lib/validation/project";
import { ExpenseModel } from "@/models/Expense";
import { ProjectModel } from "@/models/Project";
import { AuthUser } from "@/types/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function serializeExpense(expense: {
  _id: { toString(): string };
  projectId: { toString(): string };
  entries: Array<{ label: string; amount: number; details: string; date: Date; attachments: string[] }>;
  createdAt: Date;
  updatedAt: Date;
}) {
  const totalAmount = expense.entries.reduce((sum, entry) => sum + entry.amount, 0);

  return {
    id: expense._id.toString(),
    projectId: expense.projectId.toString(),
    entries: expense.entries,
    totalAmount,
    labelSummary: expense.entries.map((entry) => entry.label).join(", "),
    createdAt: expense.createdAt,
    updatedAt: expense.updatedAt,
  };
}

async function listProjectExpenses(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  await connectToDatabase();

  const project = await ProjectModel.findById(id).lean();
  if (!project) return fail("Project not found.", 404);

  const pagination = parsePaginationParams(request);

  const result = asPaginateResult<Parameters<typeof serializeExpense>[0]>(
    await ExpenseModel.paginate(
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

  return ok({
    expenses: docs.map(serializeExpense),
    pagination: {
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      totalDocs: result.totalDocs,
    },
  });
}

async function createProjectExpense(request: NextRequest, context: RouteContext, authUser: AuthUser) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = createExpenseSchema.safeParse(body);

  if (!parsed.success) {
    return fail("Invalid expense payload.", 400, parsed.error.flatten());
  }

  await connectToDatabase();

  const project = await ProjectModel.findById(id).lean();
  if (!project) return fail("Project not found.", 404);

  const expense = await ExpenseModel.create({
    projectId: id,
    entries: parsed.data.entries.map((entry) => ({
      ...entry,
      attachments: entry.attachments ?? [],
    })),
    createdBy: authUser.id,
  });

  await createAuditLog({
    actor: authUser,
    action: "create",
    module: "manpowerSubcontract",
    entityType: "Expense",
    entityId: expense._id.toString(),
    changes: { after: { projectId: id, entries: parsed.data.entries.length } },
    ipAddress: getRequestIpAddress(request),
  });

  return ok({ expense: serializeExpense(expense) });
}

export const GET = withRouteGuard(listProjectExpenses, {
  requirePermission: { module: "manpowerSubcontract", action: "view" },
});

export const POST = withRouteGuard(createProjectExpense, {
  requirePermission: { module: "manpowerSubcontract", action: "create" },
});
