import { NextRequest } from "next/server";

import { createAuditLog, getRequestIpAddress } from "@/lib/api/audit";
import { fail, ok } from "@/lib/api/response";
import { withRouteGuard } from "@/lib/api/route-guard";
import { connectToDatabase } from "@/lib/db";
import { resolvePermissionsForRole, updateUserSchema } from "@/lib/validation/user";
import { UserModel } from "@/models/User";
import { AuthUser } from "@/types/auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function serializeUser(user: {
  _id: { toString(): string };
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  permissions: unknown;
  avatarUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    permissions: user.permissions,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function getUserById(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  await connectToDatabase();

  const user = await UserModel.findById(id).select("-passwordHash").lean();

  if (!user) {
    return fail("User not found.", 404);
  }

  return ok({ user: serializeUser(user) });
}

async function updateUserById(request: NextRequest, context: RouteContext, authUser: AuthUser) {
  if (authUser.role !== "superadmin") {
    return fail("Only Super Admin can update users.", 403);
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = updateUserSchema.safeParse(body);

  if (!parsed.success) {
    return fail("Invalid update payload.", 400, parsed.error.flatten());
  }

  await connectToDatabase();

  const existingUser = await UserModel.findById(id);

  if (!existingUser) {
    return fail("User not found.", 404);
  }

  if (existingUser.role === "superadmin" && authUser.id !== existingUser._id.toString()) {
    return fail("Super Admin accounts cannot be modified.", 403);
  }

  const before = {
    name: existingUser.name,
    role: existingUser.role,
    isActive: existingUser.isActive,
    permissions: existingUser.permissions,
    avatarUrl: existingUser.avatarUrl,
  };

  if (parsed.data.name !== undefined) {
    existingUser.name = parsed.data.name;
  }

  if (parsed.data.role !== undefined) {
    existingUser.role = parsed.data.role;
    existingUser.permissions = resolvePermissionsForRole(parsed.data.role, parsed.data.permissions);
  } else if (parsed.data.permissions) {
    existingUser.permissions = resolvePermissionsForRole(existingUser.role, parsed.data.permissions);
  }

  if (parsed.data.isActive !== undefined) {
    existingUser.isActive = parsed.data.isActive;
  }

  if (parsed.data.avatarUrl !== undefined) {
    existingUser.avatarUrl = parsed.data.avatarUrl ?? undefined;
  }

  await existingUser.save();

  const after = {
    name: existingUser.name,
    role: existingUser.role,
    isActive: existingUser.isActive,
    permissions: existingUser.permissions,
    avatarUrl: existingUser.avatarUrl,
  };

  await createAuditLog({
    actor: authUser,
    action: "update",
    module: "userManagement",
    entityType: "User",
    entityId: existingUser._id.toString(),
    changes: { before, after },
    ipAddress: getRequestIpAddress(request),
  });

  return ok({ user: serializeUser(existingUser) });
}

async function deleteUserById(_request: NextRequest, context: RouteContext, authUser: AuthUser) {
  if (authUser.role !== "superadmin") {
    return fail("Only Super Admin can delete users.", 403);
  }

  const { id } = await context.params;

  if (authUser.id === id) {
    return fail("You cannot delete your own account.", 400);
  }

  await connectToDatabase();

  const existingUser = await UserModel.findById(id);

  if (!existingUser) {
    return fail("User not found.", 404);
  }

  if (existingUser.role === "superadmin") {
    return fail("Super Admin accounts cannot be deleted.", 400);
  }

  await createAuditLog({
    actor: authUser,
    action: "delete",
    module: "userManagement",
    entityType: "User",
    entityId: existingUser._id.toString(),
    changes: {
      before: {
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role,
      },
    },
    ipAddress: getRequestIpAddress(_request),
  });

  await existingUser.deleteOne();

  return ok({ deleted: true });
}

export const GET = withRouteGuard(getUserById, {
  requirePermission: {
    module: "userManagement",
    action: "view",
  },
});

export const PATCH = withRouteGuard(updateUserById, {
  requirePermission: {
    module: "userManagement",
    action: "view",
  },
});

export const DELETE = withRouteGuard(deleteUserById, {
  requirePermission: {
    module: "userManagement",
    action: "view",
  },
});
