import { NextRequest } from "next/server";

import { AuditLogModel } from "@/models/AuditLog";
import { AuthUser } from "@/types/auth";

type CreateAuditLogInput = {
  actor: AuthUser;
  action: "create" | "update" | "delete" | "login" | "logout";
  module: string;
  entityType: string;
  entityId?: string;
  changes?: {
    before?: unknown;
    after?: unknown;
  };
  ipAddress?: string;
};

export async function createAuditLog(input: CreateAuditLogInput) {
  await AuditLogModel.create({
    userId: input.actor.id,
    userName: input.actor.name,
    role: input.actor.role,
    action: input.action,
    module: input.module,
    entityType: input.entityType,
    entityId: input.entityId,
    changes: input.changes,
    timestamp: new Date(),
    ipAddress: input.ipAddress,
  });
}

function normalizeIpAddress(ip?: string | null) {
  if (!ip) return undefined;

  const trimmed = ip.trim();
  if (!trimmed) return undefined;
  if (trimmed === "::1") return "127.0.0.1";
  if (trimmed.startsWith("::ffff:")) return trimmed.slice(7);

  return trimmed;
}

export function formatIpAddress(ip?: string | null) {
  return normalizeIpAddress(ip) ?? "—";
}

export function getRequestIpAddress(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  const candidates = [
    forwarded?.split(",")[0]?.trim(),
    request.headers.get("x-real-ip")?.trim(),
    request.headers.get("cf-connecting-ip")?.trim(),
    request.headers.get("true-client-ip")?.trim(),
    request.headers.get("x-client-ip")?.trim(),
  ];

  for (const candidate of candidates) {
    const normalized = normalizeIpAddress(candidate);
    if (normalized) return normalized;
  }

  return undefined;
}
