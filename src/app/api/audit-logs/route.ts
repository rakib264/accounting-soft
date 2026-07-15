import { NextRequest } from "next/server";
import { EmptyRouteContext } from "@/lib/api/route-context";

import { formatIpAddress } from "@/lib/api/audit";
import { buildSortObject, parsePaginationParams } from "@/lib/api/pagination";
import { asPaginateResult } from "@/lib/api/paginate-result";
import { ok } from "@/lib/api/response";
import { withRouteGuard } from "@/lib/api/route-guard";
import { connectToDatabase } from "@/lib/db";
import { AuditLogModel } from "@/models/AuditLog";
import { UserModel } from "@/models/User";

type RouteContext = EmptyRouteContext;

async function listAuditLogs(request: NextRequest) {
  await connectToDatabase();

  const searchParams = request.nextUrl.searchParams;
  const email = searchParams.get("email");
  const role = searchParams.get("role");
  const auditModule = searchParams.get("module");
  const action = searchParams.get("action");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const pagination = parsePaginationParams(request, { sortBy: "timestamp", limit: 20 });

  const query: Record<string, unknown> = {};

  if (email) {
    const user = await UserModel.findOne({ email: email.toLowerCase() }).select("_id").lean();
    query.userId = user?._id?.toString() ?? "__no_match__";
  }

  if (role) query.role = role;
  if (auditModule) query.module = auditModule;
  if (action) query.action = action;

  if (from || to) {
    query.timestamp = {
      ...(from ? { $gte: new Date(from) } : {}),
      ...(to ? { $lte: new Date(to) } : {}),
    };
  }

  const result = asPaginateResult<{
    _id: { toString(): string };
    userId: string;
    userName: string;
    role: string;
    action: string;
    module: string;
    entityType: string;
    entityId?: string;
    changes?: { before?: unknown; after?: unknown };
    timestamp: Date;
    ipAddress?: string;
  }>(
    await AuditLogModel.paginate(query, {
      page: pagination.page,
      limit: pagination.limit,
      sort: buildSortObject(pagination.sortBy, pagination.sortOrder),
      lean: true,
    }),
  );

  return ok({
    logs: result.docs.map((log) => ({
      id: log._id.toString(),
      userId: log.userId,
      userName: log.userName,
      role: log.role,
      action: log.action,
      module: log.module,
      entityType: log.entityType,
      entityId: log.entityId,
      changes: log.changes,
      timestamp: log.timestamp,
      ipAddress: formatIpAddress(log.ipAddress),
    })),
    pagination: {
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      totalDocs: result.totalDocs,
    },
  });
}

export const GET = withRouteGuard(listAuditLogs, {
  requirePermission: { module: "auditLogs", action: "view" },
});
