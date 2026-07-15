import { NextRequest, NextResponse } from "next/server";

import { attachCsrfCookie } from "@/lib/csrf";
import { withRouteGuard } from "@/lib/api/route-guard";
import { AuthUser } from "@/types/auth";

async function getCurrentUser(_request: NextRequest, _context: unknown, authUser: AuthUser) {
  const response = NextResponse.json({
    success: true,
    data: { user: authUser },
  });

  attachCsrfCookie(response);
  return response;
}

export const GET = withRouteGuard(getCurrentUser);
