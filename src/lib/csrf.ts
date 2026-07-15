import { randomBytes } from "crypto";

import { NextRequest, NextResponse } from "next/server";

export const CSRF_COOKIE_NAME = "accounting_csrf";
export const CSRF_HEADER_NAME = "x-csrf-token";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const CSRF_EXEMPT_PATHS = ["/api/auth/login", "/api/health"];

export function generateCsrfToken() {
  return randomBytes(32).toString("hex");
}

export function attachCsrfCookie(response: NextResponse, token?: string) {
  const value = token ?? generateCsrfToken();

  response.cookies.set({
    name: CSRF_COOKIE_NAME,
    value,
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return value;
}

export function clearCsrfCookie(response: NextResponse) {
  response.cookies.set({
    name: CSRF_COOKIE_NAME,
    value: "",
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export function isCsrfExempt(pathname: string) {
  return CSRF_EXEMPT_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function validateCsrfRequest(request: NextRequest) {
  if (!MUTATING_METHODS.has(request.method)) {
    return true;
  }

  if (isCsrfExempt(request.nextUrl.pathname)) {
    return true;
  }

  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  return Boolean(cookieToken && headerToken && cookieToken === headerToken);
}

export function getClientCsrfToken() {
  if (typeof document === "undefined") {
    return "";
  }

  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${CSRF_COOKIE_NAME}=`))
      ?.split("=")[1] ?? ""
  );
}
