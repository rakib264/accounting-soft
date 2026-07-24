import { NextRequest } from "next/server";

import { invoiceGrossTotalExpression } from "@/lib/api/invoice-totals";
import { getProjectFinancials } from "@/lib/api/reporting";
import { fail, ok } from "@/lib/api/response";
import { withRouteGuard } from "@/lib/api/route-guard";
import { hasPermission } from "@/lib/auth/rbac";
import { PERMISSION_DENIED_MESSAGE } from "@/lib/constants";
import { connectToDatabase } from "@/lib/db";
import { ExpenseModel } from "@/models/Expense";
import { InvoiceModel } from "@/models/Invoice";
import { ProjectModel } from "@/models/Project";
import { TradeTransactionModel } from "@/models/TradeTransaction";

function parseDateRange(request: NextRequest) {
  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");
  return {
    ...(from ? { $gte: new Date(from) } : {}),
    ...(to ? { $lte: new Date(to) } : {}),
  };
}

async function getDashboardReport() {
  await connectToDatabase();

  const [projectCount, invoiceStats, expenseStats, tradeStats, monthlyInvoices, monthlyExpenses] = await Promise.all([
    ProjectModel.countDocuments(),
    InvoiceModel.aggregate([
      { $group: { _id: null, total: { $sum: invoiceGrossTotalExpression }, count: { $sum: 1 } } },
    ]),
    ExpenseModel.aggregate([
      { $unwind: "$entries" },
      { $group: { _id: null, total: { $sum: "$entries.amount" }, count: { $sum: 1 } } },
    ]),
    TradeTransactionModel.aggregate([
      {
        $group: {
          _id: null,
          totalCredit: { $sum: "$credit" },
          totalDebit: { $sum: "$debit" },
        },
      },
    ]),
    InvoiceModel.aggregate([
      {
        $group: {
          _id: { year: { $year: "$invoiceDate" }, month: { $month: "$invoiceDate" } },
          revenue: { $sum: invoiceGrossTotalExpression },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 12 },
    ]),
    ExpenseModel.aggregate([
      { $unwind: "$entries" },
      {
        $group: {
          _id: { year: { $year: "$entries.date" }, month: { $month: "$entries.date" } },
          expenses: { $sum: "$entries.amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 12 },
    ]),
  ]);

  const totalRevenue = invoiceStats[0]?.total ?? 0;
  const totalExpenses = expenseStats[0]?.total ?? 0;

  const expenseMap = new Map(
    monthlyExpenses.map((row) => [
      `${row._id.year}-${String(row._id.month).padStart(2, "0")}`,
      row.expenses as number,
    ]),
  );

  const trendLabels = new Set([
    ...monthlyInvoices.map((row) => `${row._id.year}-${String(row._id.month).padStart(2, "0")}`),
    ...monthlyExpenses.map((row) => `${row._id.year}-${String(row._id.month).padStart(2, "0")}`),
  ]);

  const monthlyTrend = [...trendLabels]
    .sort()
    .slice(-12)
    .map((label) => {
      const invoiceRow = monthlyInvoices.find(
        (row) => `${row._id.year}-${String(row._id.month).padStart(2, "0")}` === label,
      );
      return {
        label,
        revenue: invoiceRow?.revenue ?? 0,
        expenses: expenseMap.get(label) ?? 0,
      };
    });

  return ok({
    summary: {
      totalProjects: projectCount,
      totalInvoices: invoiceStats[0]?.count ?? 0,
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      tradeCredit: tradeStats[0]?.totalCredit ?? 0,
      tradeDebit: tradeStats[0]?.totalDebit ?? 0,
    },
    monthlyTrend,
  });
}

async function getModuleReport(request: NextRequest) {
  await connectToDatabase();

  const searchParams = request.nextUrl.searchParams;
  const businessType = searchParams.get("businessType");
  const projectId = searchParams.get("projectId");
  const dateRange = parseDateRange(request);

  const projectQuery: Record<string, unknown> = {};

  if (businessType === "manpower" || businessType === "subcontract" || businessType === "trade") {
    projectQuery.businessType = businessType;
  }

  if (projectId) {
    projectQuery._id = projectId;
  }

  const projects = await ProjectModel.find(projectQuery).select("_id").lean();
  const projectIds = projects.map((p) => p._id.toString());

  const financials = await getProjectFinancials(projectIds, dateRange);

  return ok({
    summary: {
      totalProjects: projectIds.length,
      totalInvoices: financials.invoiceCount,
      totalInvoiceAmount: financials.totalInvoiced,
      totalVatAmount: financials.totalVatAmount,
      totalReceived: financials.totalReceived,
      totalDue: financials.totalDue,
      totalExpenses: financials.totalExpenses,
      netIncome: financials.netIncome,
    },
  });
}

export const GET = withRouteGuard(
  async (request, _context, authUser) => {
    const type = request.nextUrl.searchParams.get("type");

    if (type === "module") {
      const canViewManpower = hasPermission(authUser, "manpowerSubcontract", "view");
      const canViewTrade = hasPermission(authUser, "trade", "view");
      if (!canViewManpower && !canViewTrade) {
        return fail(PERMISSION_DENIED_MESSAGE, 403);
      }
      return getModuleReport(request);
    }

    return getDashboardReport();
  },
);
