import { NextRequest, NextResponse } from "next/server";

import { createAuditLog, getRequestIpAddress } from "@/lib/api/audit";
import { fail, ok } from "@/lib/api/response";
import { toAuthUser } from "@/lib/api/user";
import { comparePassword } from "@/lib/auth/password";
import { attachCsrfCookie } from "@/lib/csrf";
import { attachSessionCookie } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { loginSchema } from "@/lib/validation/auth";
import { UserModel } from "@/models/User";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return fail("Invalid login payload.", 400, parsed.error.flatten());
  }

  await connectToDatabase();

  const user = await UserModel.findOne({ email: parsed.data.email });

  if (!user || !user.isActive) {
    return fail("Invalid email or password.", 401);
  }

  const isPasswordValid = await comparePassword(parsed.data.password, user.passwordHash);

  if (!isPasswordValid) {
    return fail("Invalid email or password.", 401);
  }

  const authUser = toAuthUser(user);

  await createAuditLog({
    actor: authUser,
    action: "login",
    module: "auth",
    entityType: "session",
    entityId: authUser.id,
    ipAddress: getRequestIpAddress(request),
  });

  const response = NextResponse.json(
    {
      success: true,
      data: {
        user: authUser,
      },
    },
    { status: 200 },
  );

  attachSessionCookie(response, authUser);
  attachCsrfCookie(response);

  return response;
}

export async function GET() {
  return ok({
    message: "Use POST to authenticate with email and password.",
  });
}
