import { NextRequest } from "next/server";

import { createAuditLog, getRequestIpAddress } from "@/lib/api/audit";
import { getProjectFinancials } from "@/lib/api/reporting";
import { fail, ok } from "@/lib/api/response";
import { withRouteGuard } from "@/lib/api/route-guard";
import { connectToDatabase } from "@/lib/db";
import { updateProjectSchema } from "@/lib/validation/project";
import { ExpenseModel } from "@/models/Expense";
import { InvoiceModel } from "@/models/Invoice";
import { ProjectModel } from "@/models/Project";
import { AuthUser } from "@/types/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function getProject(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  await connectToDatabase();

  const project = await ProjectModel.findById(id).lean();

  if (!project) {
    return fail("Project not found.", 404);
  }

  const financials = await getProjectFinancials([id]);

  return ok({
    project: {
      id: project._id.toString(),
      name: project.name,
      details: project.details,
      imageUrl: project.imageUrl,
      businessType: project.businessType,
      totalInvoiced: financials.totalInvoiced,
      totalExpenses: financials.totalExpenses,
      totalVatAmount: financials.totalVatAmount,
      invoiceCount: financials.invoiceCount,
      expenseCount: financials.expenseCount,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    },
  });
}

async function updateProject(request: NextRequest, context: RouteContext, authUser: AuthUser) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = updateProjectSchema.safeParse(body);

  if (!parsed.success) {
    return fail("Invalid project payload.", 400, parsed.error.flatten());
  }

  await connectToDatabase();

  const existing = await ProjectModel.findById(id);

  if (!existing) {
    return fail("Project not found.", 404);
  }

  const before = {
    name: existing.name,
    details: existing.details,
    imageUrl: existing.imageUrl,
    businessType: existing.businessType,
  };

  if (parsed.data.name !== undefined) existing.name = parsed.data.name;
  if (parsed.data.details !== undefined) existing.details = parsed.data.details;
  if (parsed.data.imageUrl !== undefined) existing.imageUrl = parsed.data.imageUrl;
  if (parsed.data.businessType !== undefined) existing.businessType = parsed.data.businessType;

  await existing.save();

  await createAuditLog({
    actor: authUser,
    action: "update",
    module: "manpowerSubcontract",
    entityType: "Project",
    entityId: id,
    changes: {
      before,
      after: {
        name: existing.name,
        details: existing.details,
        imageUrl: existing.imageUrl,
        businessType: existing.businessType,
      },
    },
    ipAddress: getRequestIpAddress(request),
  });

  const financials = await getProjectFinancials([id]);

  return ok({
    project: {
      id: existing._id.toString(),
      name: existing.name,
      details: existing.details,
      imageUrl: existing.imageUrl,
      businessType: existing.businessType,
      totalInvoiced: financials.totalInvoiced,
      totalExpenses: financials.totalExpenses,
      totalVatAmount: financials.totalVatAmount,
      createdAt: existing.createdAt,
      updatedAt: existing.updatedAt,
    },
  });
}

async function deleteProject(request: NextRequest, context: RouteContext, authUser: AuthUser) {
  const { id } = await context.params;
  await connectToDatabase();

  const existing = await ProjectModel.findById(id);

  if (!existing) {
    return fail("Project not found.", 404);
  }

  await Promise.all([
    InvoiceModel.deleteMany({ projectId: id }),
    ExpenseModel.deleteMany({ projectId: id }),
    ProjectModel.findByIdAndDelete(id),
  ]);

  await createAuditLog({
    actor: authUser,
    action: "delete",
    module: "manpowerSubcontract",
    entityType: "Project",
    entityId: id,
    changes: {
      before: {
        name: existing.name,
        businessType: existing.businessType,
      },
    },
    ipAddress: getRequestIpAddress(request),
  });

  return ok({ message: "Project deleted." });
}

export const GET = withRouteGuard(getProject, {
  requirePermission: { module: "manpowerSubcontract", action: "view" },
});

export const PATCH = withRouteGuard(updateProject, {
  requirePermission: { module: "manpowerSubcontract", action: "edit" },
});

export const DELETE = withRouteGuard(deleteProject, {
  requirePermission: { module: "manpowerSubcontract", action: "delete" },
});
