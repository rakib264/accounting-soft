import { NextRequest } from "next/server";
import { EmptyRouteContext } from "@/lib/api/route-context";

import { fail, ok } from "@/lib/api/response";
import { withRouteGuard } from "@/lib/api/route-guard";
import { parseTradeFile } from "@/lib/trade/parser";

type RouteContext = EmptyRouteContext;

async function parseUpload(request: NextRequest) {
  const formData = await request.formData().catch(() => null);

  if (!formData) {
    return fail("Invalid form data.", 400);
  }

  const files = formData.getAll("files").filter((item): item is File => item instanceof File);

  if (files.length === 0) {
    return fail("No files provided.", 400);
  }

  try {
    const results = await Promise.all(
      files.map(async (file) => ({
        fileName: file.name,
        transactions: await parseTradeFile(file),
      })),
    );

    return ok({ files: results });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Failed to parse file.", 400);
  }
}

export const POST = withRouteGuard(parseUpload, {
  requirePermission: { module: "trade", action: "create" },
});
