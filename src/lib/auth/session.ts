import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIE_NAME } from "@/lib/constants";
import { getSessionTtlSeconds, signSessionToken, verifySessionToken } from "@/lib/auth/jwt";
import { AuthUser } from "@/types/auth";

export async function getSessionTokenFromRequest(request: NextRequest) {
  return request.cookies.get(AUTH_COOKIE_NAME)?.value ?? null;
}

export async function getSessionTokenFromCookieStore() {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value ?? null;
}

export function readSessionPayload(token: string) {
  return verifySessionToken(token);
}

export function attachSessionCookie(response: NextResponse, user: AuthUser) {
  const maxAge = getSessionTtlSeconds();
  const token = signSessionToken(user);

  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
