import { NextRequest, NextResponse } from "next/server";

import { createAuditLog, getRequestIpAddress } from "@/lib/api/audit";
import { fail } from "@/lib/api/response";
import { toAuthUser } from "@/lib/api/user";
import { readSessionPayload } from "@/lib/auth/session";
import { clearSessionCookie } from "@/lib/auth/session";
import { AUTH_COOKIE_NAME } from "@/lib/constants";
import { clearCsrfCookie, validateCsrfRequest } from "@/lib/csrf";
import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/models/User";

export async function POST(request: NextRequest) {
  if (!validateCsrfRequest(request)) {
    return fail("Invalid or missing CSRF token.", 403);
  }

  const sessionToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const payload = sessionToken ? readSessionPayload(sessionToken) : null;

  if (payload) {
    await connectToDatabase();
    const user = await UserModel.findById(payload.sub);

    if (user?.isActive) {
      await createAuditLog({
        actor: toAuthUser(user),
        action: "logout",
        module: "auth",
        entityType: "session",
        entityId: payload.sub,
        ipAddress: getRequestIpAddress(request),
      });
    }
  }

  const response = NextResponse.json({
    success: true,
    data: {
      message: "Logged out successfully.",
    },
  });

  clearSessionCookie(response);
  clearCsrfCookie(response);
  return response;
}
