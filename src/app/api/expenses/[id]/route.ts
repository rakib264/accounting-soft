import { NextRequest } from "next/server";

import { createAuditLog, getRequestIpAddress } from "@/lib/api/audit";
import { fail, ok } from "@/lib/api/response";
import { withRouteGuard } from "@/lib/api/route-guard";
import { connectToDatabase } from "@/lib/db";
import { updateExpenseSchema } from "@/lib/validation/project";
import { ExpenseModel } from "@/models/Expense";
import { AuthUser } from "@/types/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function updateExpense(request: NextRequest, context: RouteContext, authUser: AuthUser) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = updateExpenseSchema.safeParse(body);

  if (!parsed.success) {
    return fail("Invalid expense payload.", 400, parsed.error.flatten());
  }

  await connectToDatabase();

  const expense = await ExpenseModel.findById(id);
  if (!expense) return fail("Expense not found.", 404);

  const before = { entries: expense.entries };

  if (parsed.data.entries) {
    expense.entries = parsed.data.entries.map((entry) => ({
      ...entry,
      attachments: entry.attachments ?? [],
    }));
  }

  await expense.save();

  await createAuditLog({
    actor: authUser,
    action: "update",
    module: "manpowerSubcontract",
    entityType: "Expense",
    entityId: id,
    changes: { before, after: { entries: expense.entries.length } },
    ipAddress: getRequestIpAddress(request),
  });

  return ok({
    expense: {
      id: expense._id.toString(),
      projectId: expense.projectId.toString(),
      entries: expense.entries,
    },
  });
}

async function deleteExpense(request: NextRequest, context: RouteContext, authUser: AuthUser) {
  const { id } = await context.params;
  await connectToDatabase();

  const expense = await ExpenseModel.findById(id);
  if (!expense) return fail("Expense not found.", 404);

  await ExpenseModel.findByIdAndDelete(id);

  await createAuditLog({
    actor: authUser,
    action: "delete",
    module: "manpowerSubcontract",
    entityType: "Expense",
    entityId: id,
    ipAddress: getRequestIpAddress(request),
  });

  return ok({ message: "Expense deleted." });
}

export const PATCH = withRouteGuard(updateExpense, {
  requirePermission: { module: "manpowerSubcontract", action: "edit" },
});

export const DELETE = withRouteGuard(deleteExpense, {
  requirePermission: { module: "manpowerSubcontract", action: "delete" },
});
