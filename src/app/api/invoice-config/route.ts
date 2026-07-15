import { NextRequest } from "next/server";
import { EmptyRouteContext } from "@/lib/api/route-context";

import { ok } from "@/lib/api/response";
import { withRouteGuard } from "@/lib/api/route-guard";
import { connectToDatabase } from "@/lib/db";
import { SettingsModel } from "@/models/Settings";

type RouteContext = EmptyRouteContext;

async function getInvoiceConfig(_request: NextRequest) {
  await connectToDatabase();

  const settings = await SettingsModel.findOne({ singletonKey: "global" }).lean();

  return ok({
    vatPercent: settings?.vatPercent ?? 15,
    currency: settings?.currency ?? "SAR",
    invoiceLabels: settings?.invoiceLabels ?? [],
  });
}

export const GET = withRouteGuard(getInvoiceConfig);
