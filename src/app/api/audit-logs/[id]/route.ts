import { NextRequest } from "next/server";

import { fail, ok } from "@/lib/api/response";
import { withRouteGuard } from "@/lib/api/route-guard";
import { connectToDatabase } from "@/lib/db";
import { AuditLogModel } from "@/models/AuditLog";
import { AuthUser } from "@/types/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function deleteAuditLog(_request: NextRequest, context: RouteContext, authUser: AuthUser) {
  if (authUser.role !== "superadmin") {
    return fail("Only Super Admin can delete audit logs.", 403);
  }

  const { id } = await context.params;
  await connectToDatabase();

  const deleted = await AuditLogModel.findByIdAndDelete(id);
  if (!deleted) {
    return fail("Audit log not found.", 404);
  }

  return ok({ deleted: true });
}

export const DELETE = withRouteGuard(deleteAuditLog, {
  requirePermission: { module: "auditLogs", action: "view" },
});
