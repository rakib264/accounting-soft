import { NextRequest } from "next/server";
import { EmptyRouteContext } from "@/lib/api/route-context";

import { createAuditLog, getRequestIpAddress } from "@/lib/api/audit";
import { fail, ok } from "@/lib/api/response";
import { withRouteGuard } from "@/lib/api/route-guard";
import { connectToDatabase } from "@/lib/db";
import { updateSettingsSchema } from "@/lib/validation/settings";
import { SettingsModel } from "@/models/Settings";
import { AuthUser } from "@/types/auth";

type RouteContext = EmptyRouteContext;

async function getSettings(_request: NextRequest, _context: RouteContext) {
  await connectToDatabase();

  const settings = await SettingsModel.findOneAndUpdate(
    { singletonKey: "global" },
    {},
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).lean();

  return ok({
    settings: {
      vatPercent: settings.vatPercent,
      currency: settings.currency,
      invoiceLabels: settings.invoiceLabels,
      updatedAt: settings.updatedAt,
    },
  });
}

async function updateSettings(request: NextRequest, _context: RouteContext, authUser: AuthUser) {
  if (authUser.role !== "superadmin") {
    return fail("Only Super Admin can update global settings.", 403);
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSettingsSchema.safeParse(body);

  if (!parsed.success) {
    return fail("Invalid settings payload.", 400, parsed.error.flatten());
  }

  await connectToDatabase();

  const existingSettings = await SettingsModel.findOne({ singletonKey: "global" }).lean();

  const updated = await SettingsModel.findOneAndUpdate(
    { singletonKey: "global" },
    {
      vatPercent: parsed.data.vatPercent,
      currency: parsed.data.currency.toUpperCase(),
      invoiceLabels: parsed.data.invoiceLabels,
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  await createAuditLog({
    actor: authUser,
    action: "update",
    module: "settings",
    entityType: "Settings",
    entityId: "global",
    changes: {
      before: existingSettings
        ? {
            vatPercent: existingSettings.vatPercent,
            currency: existingSettings.currency,
            invoiceLabels: existingSettings.invoiceLabels,
          }
        : undefined,
      after: {
        vatPercent: updated.vatPercent,
        currency: updated.currency,
        invoiceLabels: updated.invoiceLabels,
      },
    },
    ipAddress: getRequestIpAddress(request),
  });

  return ok({
    settings: {
      vatPercent: updated.vatPercent,
      currency: updated.currency,
      invoiceLabels: updated.invoiceLabels,
      updatedAt: updated.updatedAt,
    },
  });
}

export const GET = withRouteGuard(getSettings, {
  requirePermission: {
    module: "settings",
    action: "view",
  },
});

export const PATCH = withRouteGuard(updateSettings, {
  requirePermission: {
    module: "settings",
    action: "view",
  },
});
