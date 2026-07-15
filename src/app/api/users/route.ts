import { NextRequest } from "next/server";
import { EmptyRouteContext } from "@/lib/api/route-context";

import { createAuditLog, getRequestIpAddress } from "@/lib/api/audit";
import { buildSortObject, parsePaginationParams } from "@/lib/api/pagination";
import { asPaginateResult } from "@/lib/api/paginate-result";
import { fail, ok } from "@/lib/api/response";
import { withRouteGuard } from "@/lib/api/route-guard";
import { toAuthUser } from "@/lib/api/user";
import { hashPassword } from "@/lib/auth/password";
import { connectToDatabase } from "@/lib/db";
import { createUserSchema, resolvePermissionsForRole } from "@/lib/validation/user";
import { UserModel } from "@/models/User";
import { AuthUser } from "@/types/auth";

type RouteContext = EmptyRouteContext;

async function listUsers(request: NextRequest) {
  await connectToDatabase();

  const pagination = parsePaginationParams(request, { sortBy: "createdAt" });
  const search = pagination.search;

  const query: Record<string, unknown> = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const result = asPaginateResult<{
    _id: { toString(): string };
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    permissions: unknown;
    avatarUrl?: string;
    createdAt: Date;
    updatedAt: Date;
  }>(
    await UserModel.paginate(query, {
      page: pagination.page,
      limit: pagination.limit,
      sort: buildSortObject(pagination.sortBy, pagination.sortOrder),
      select: "-passwordHash",
      lean: true,
    }),
  );

  return ok({
    users: result.docs.map((user) => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      permissions: user.permissions,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })),
    pagination: {
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      totalDocs: result.totalDocs,
    },
  });
}

async function createUser(request: NextRequest, _context: RouteContext, authUser: AuthUser) {
  if (authUser.role !== "superadmin") {
    return fail("Only Super Admin can create users.", 403);
  }

  const body = await request.json().catch(() => null);
  const parsed = createUserSchema.safeParse(body);

  if (!parsed.success) {
    return fail("Invalid user payload.", 400, parsed.error.flatten());
  }

  await connectToDatabase();

  const existingUser = await UserModel.findOne({ email: parsed.data.email }).lean();
  if (existingUser) return fail("Email already exists.", 409);

  const passwordHash = await hashPassword(parsed.data.password);
  const permissions = resolvePermissionsForRole(parsed.data.role, parsed.data.permissions);

  const createdUser = await UserModel.create({
    name: parsed.data.name,
    email: parsed.data.email,
    passwordHash,
    role: parsed.data.role,
    permissions,
    isActive: true,
    avatarUrl: parsed.data.avatarUrl,
  });

  await createAuditLog({
    actor: authUser,
    action: "create",
    module: "userManagement",
    entityType: "User",
    entityId: createdUser._id.toString(),
    changes: {
      after: {
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
        permissions: createdUser.permissions,
        avatarUrl: createdUser.avatarUrl,
      },
    },
    ipAddress: getRequestIpAddress(request),
  });

  return ok({ user: toAuthUser(createdUser) });
}

export const GET = withRouteGuard(listUsers, {
  requirePermission: { module: "userManagement", action: "view" },
});

export const POST = withRouteGuard(createUser, {
  requirePermission: { module: "userManagement", action: "view" },
});
