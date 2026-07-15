import { NextRequest } from "next/server";
import { EmptyRouteContext } from "@/lib/api/route-context";

import { createAuditLog, getRequestIpAddress } from "@/lib/api/audit";
import { fail, ok } from "@/lib/api/response";
import { withRouteGuard } from "@/lib/api/route-guard";
import { connectToDatabase } from "@/lib/db";
import { saveUploadFiles } from "@/lib/upload";
import { AuthUser } from "@/types/auth";

type RouteContext = EmptyRouteContext;

async function uploadFiles(request: NextRequest, _context: RouteContext, authUser: AuthUser) {
  const formData = await request.formData().catch(() => null);

  if (!formData) {
    return fail("Invalid form data.", 400);
  }

  const folder = (formData.get("folder") as string) || "misc";
  const files = formData.getAll("files").filter((item): item is File => item instanceof File);

  if (files.length === 0) {
    return fail("No files provided.", 400);
  }

  try {
    const urls = await saveUploadFiles(files, folder);

    await createAuditLog({
      actor: authUser,
      action: "create",
      module: "uploads",
      entityType: "File",
      changes: { after: { folder, count: urls.length, urls } },
      ipAddress: getRequestIpAddress(request),
    });

    return ok({ urls });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Upload failed.", 400);
  }
}

export const POST = withRouteGuard(uploadFiles);
