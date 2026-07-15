import { NextRequest } from "next/server";
import { EmptyRouteContext } from "@/lib/api/route-context";

import { createAuditLog, getRequestIpAddress } from "@/lib/api/audit";
import { buildSortObject, parsePaginationParams } from "@/lib/api/pagination";
import { asPaginateResult } from "@/lib/api/paginate-result";
import { fail, ok } from "@/lib/api/response";
import { withRouteGuard } from "@/lib/api/route-guard";
import { connectToDatabase } from "@/lib/db";
import { commitTradeSchema } from "@/lib/validation/project";
import { TradeTransactionModel } from "@/models/TradeTransaction";
import { AuthUser } from "@/types/auth";

type RouteContext = EmptyRouteContext;

async function listTradeTransactions(request: NextRequest) {
  await connectToDatabase();

  const searchParams = request.nextUrl.searchParams;
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const pagination = parsePaginationParams(request, { sortBy: "date" });

  const query: Record<string, unknown> = {};

  if (from || to) {
    query.date = {
      ...(from ? { $gte: new Date(from) } : {}),
      ...(to ? { $lte: new Date(to) } : {}),
    };
  }

  const result = asPaginateResult<{
    _id: { toString(): string };
    sourceFile: string;
    date: Date;
    description: string;
    debit: number;
    credit: number;
    balance: number;
    reference?: string;
    createdAt: Date;
  }>(
    await TradeTransactionModel.paginate(query, {
      page: pagination.page,
      limit: pagination.limit,
      sort: buildSortObject(pagination.sortBy, pagination.sortOrder),
      lean: true,
    }),
  );

  const [summary] = await TradeTransactionModel.aggregate([
    ...(Object.keys(query).length ? [{ $match: query }] : []),
    {
      $group: {
        _id: null,
        totalCredit: { $sum: "$credit" },
        totalDebit: { $sum: "$debit" },
      },
    },
  ]);

  const docs = result.docs;

  return ok({
    transactions: docs.map((tx) => ({
      id: tx._id.toString(),
      sourceFile: tx.sourceFile,
      date: tx.date,
      description: tx.description,
      debit: tx.debit,
      credit: tx.credit,
      balance: tx.balance,
      reference: tx.reference,
      createdAt: tx.createdAt,
    })),
    summary: {
      totalCredit: summary?.totalCredit ?? 0,
      totalDebit: summary?.totalDebit ?? 0,
      netBalance: (summary?.totalCredit ?? 0) - (summary?.totalDebit ?? 0),
    },
    pagination: {
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      totalDocs: result.totalDocs,
    },
  });
}

async function commitTradeTransactions(request: NextRequest, _context: RouteContext, authUser: AuthUser) {
  const body = await request.json().catch(() => null);
  const parsed = commitTradeSchema.safeParse(body);

  if (!parsed.success) {
    return fail("Invalid trade payload.", 400, parsed.error.flatten());
  }

  await connectToDatabase();

  const created = await TradeTransactionModel.insertMany(
    parsed.data.transactions.map((tx) => ({
      sourceFile: parsed.data.sourceFile,
      date: tx.date,
      description: tx.description,
      debit: tx.debit,
      credit: tx.credit,
      balance: tx.balance,
      reference: tx.reference,
      rawExtractedData: tx.rawExtractedData,
      uploadedBy: authUser.id,
    })),
  );

  await createAuditLog({
    actor: authUser,
    action: "create",
    module: "trade",
    entityType: "TradeTransaction",
    entityId: parsed.data.sourceFile,
    changes: { after: { count: created.length } },
    ipAddress: getRequestIpAddress(request),
  });

  return ok({ count: created.length });
}

export const GET = withRouteGuard(listTradeTransactions, {
  requirePermission: { module: "trade", action: "view" },
});

export const POST = withRouteGuard(commitTradeTransactions, {
  requirePermission: { module: "trade", action: "create" },
});
