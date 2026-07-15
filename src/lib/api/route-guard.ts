import { NextRequest } from "next/server";

import { validateCsrfRequest } from "@/lib/csrf";
import { hasPermission } from "@/lib/auth/rbac";
import { readSessionPayload } from "@/lib/auth/session";
import { AUTH_COOKIE_NAME, PERMISSION_DENIED_MESSAGE } from "@/lib/constants";
import { connectToDatabase } from "@/lib/db";
import { fail } from "@/lib/api/response";
import { toAuthUser } from "@/lib/api/user";
import { UserModel } from "@/models/User";
import { AuthUser, PermissionAction, PermissionModule } from "@/types/auth";

type GuardOptions = {
  requireRole?: AuthUser["role"];
  requirePermission?: {
    module: PermissionModule;
    action: PermissionAction;
  };
};

export type AuthedRouteHandler<TContext = unknown> = (
  request: NextRequest,
  context: TContext,
  authUser: AuthUser,
) => Promise<Response>;

export function withRouteGuard<TContext = unknown>(handler: AuthedRouteHandler<TContext>, options?: GuardOptions) {
  return async (request: NextRequest, context: TContext) => {
    if (!validateCsrfRequest(request)) {
      return fail("Invalid or missing CSRF token.", 403);
    }

    const sessionToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (!sessionToken) {
      return fail("Unauthorized request.", 401);
    }

    const payload = readSessionPayload(sessionToken);

    if (!payload) {
      return fail("Session is invalid or expired.", 401);
    }

    await connectToDatabase();

    const user = await UserModel.findById(payload.sub).lean();

    if (!user || !user.isActive) {
      return fail("User is inactive or unavailable.", 401);
    }

    const authUser = toAuthUser(user);

    if (options?.requireRole && authUser.role !== options.requireRole) {
      return fail(PERMISSION_DENIED_MESSAGE, 403);
    }

    if (options?.requirePermission) {
      const isAllowed = hasPermission(authUser, options.requirePermission.module, options.requirePermission.action);

      if (!isAllowed) {
        return fail(PERMISSION_DENIED_MESSAGE, 403);
      }
    }

    return handler(request, context, authUser);
  };
}
