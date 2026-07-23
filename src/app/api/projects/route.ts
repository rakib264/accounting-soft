import { NextRequest } from "next/server";

import { EmptyRouteContext } from "@/lib/api/route-context";
import { createAuditLog, getRequestIpAddress } from "@/lib/api/audit";
import { buildSortObject, parsePaginationParams } from "@/lib/api/pagination";
import { asPaginateResult } from "@/lib/api/paginate-result";
import { getProjectFinancialsMap } from "@/lib/api/reporting";
import { fail, ok } from "@/lib/api/response";
import { withRouteGuard } from "@/lib/api/route-guard";
import { connectToDatabase } from "@/lib/db";
import { createProjectSchema } from "@/lib/validation/project";
import { ProjectModel } from "@/models/Project";
import { AuthUser } from "@/types/auth";

type RouteContext = EmptyRouteContext;

async function listProjects(request: NextRequest, _context: RouteContext) {
  await connectToDatabase();

  const searchParams = request.nextUrl.searchParams;
  const businessType = searchParams.get("businessType");
  const pagination = parsePaginationParams(request);

  const query: Record<string, unknown> = {};

  if (businessType === "manpower" || businessType === "subcontract") {
    query.businessType = businessType;
  }

  if (pagination.search) {
    query.$or = [
      { name: { $regex: pagination.search, $options: "i" } },
      { details: { $regex: pagination.search, $options: "i" } },
    ];
  }

  const result = asPaginateResult<{
    _id: { toString(): string };
    name: string;
    details: string;
    imageUrl?: string;
    businessType: string;
    createdAt: Date;
    updatedAt: Date;
  }>(
    await ProjectModel.paginate(query, {
      page: pagination.page,
      limit: pagination.limit,
      sort: buildSortObject(pagination.sortBy, pagination.sortOrder),
      lean: true,
    }),
  );

  const docs = result.docs;
  const financialsMap = await getProjectFinancialsMap(docs.map((doc) => doc._id.toString()));

  return ok({
    projects: docs.map((project) => {
      const financials = financialsMap.get(project._id.toString()) ?? {
        totalInvoiced: 0,
        totalExpenses: 0,
        totalVatAmount: 0,
      };
      return {
        id: project._id.toString(),
        name: project.name,
        details: project.details,
        imageUrl: project.imageUrl,
        businessType: project.businessType,
        totalInvoiced: financials.totalInvoiced,
        totalExpenses: financials.totalExpenses,
        totalVatAmount: financials.totalVatAmount,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      };
    }),
    pagination: {
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      totalDocs: result.totalDocs,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
    },
  });
}

async function createProject(request: NextRequest, _context: RouteContext, authUser: AuthUser) {
  const body = await request.json().catch(() => null);
  const parsed = createProjectSchema.safeParse(body);

  if (!parsed.success) {
    return fail("Invalid project payload.", 400, parsed.error.flatten());
  }

  await connectToDatabase();

  const project = await ProjectModel.create({
    ...parsed.data,
    createdBy: authUser.id,
  });

  await createAuditLog({
    actor: authUser,
    action: "create",
    module: "manpowerSubcontract",
    entityType: "Project",
    entityId: project._id.toString(),
    changes: { after: parsed.data },
    ipAddress: getRequestIpAddress(request),
  });

  return ok({
    project: {
      id: project._id.toString(),
      name: project.name,
      details: project.details,
      imageUrl: project.imageUrl,
      businessType: project.businessType,
      totalInvoiced: 0,
      totalExpenses: 0,
      totalVatAmount: 0,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    },
  });
}

export const GET = withRouteGuard(listProjects, {
  requirePermission: { module: "manpowerSubcontract", action: "view" },
});

export const POST = withRouteGuard(createProject, {
  requirePermission: { module: "manpowerSubcontract", action: "create" },
});
