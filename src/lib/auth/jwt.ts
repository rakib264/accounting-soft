import jwt from "jsonwebtoken";

import { env } from "@/lib/env";
import { AuthUser, UserPermissions, UserRole } from "@/types/auth";

export type SessionJwtPayload = {
  sub: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: UserPermissions;
};

const SESSION_TTL_SECONDS = 60 * 60 * 8;

export function signSessionToken(user: AuthUser) {
  const payload: SessionJwtPayload = {
    sub: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    permissions: user.permissions,
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: SESSION_TTL_SECONDS,
  });
}

export function verifySessionToken(token: string): SessionJwtPayload | null {
  try {
    return jwt.verify(token, env.JWT_SECRET) as SessionJwtPayload;
  } catch {
    return null;
  }
}

export function getSessionTtlSeconds() {
  return SESSION_TTL_SECONDS;
}
