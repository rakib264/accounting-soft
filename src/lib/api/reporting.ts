import { Types } from "mongoose";

import { invoiceGrossTotalExpression } from "@/lib/api/invoice-totals";
import { ExpenseModel } from "@/models/Expense";
import { InvoiceModel } from "@/models/Invoice";
import { ReceivedAmountModel } from "@/models/ReceivedAmount";

export type ProjectFinancialMetrics = {
  totalInvoiced: number;
  totalExpenses: number;
  totalVatAmount: number;
  totalReceived: number;
  totalDue: number;
  netIncome: number;
  invoiceCount: number;
  expenseCount: number;
  receivedCount: number;
};

type DateRange = Record<string, Date>;

function deriveMetrics(values: {
  totalInvoiced: number;
  totalExpenses: number;
  totalVatAmount: number;
  totalReceived: number;
  invoiceCount: number;
  expenseCount: number;
  receivedCount: number;
}): ProjectFinancialMetrics {
  return {
    ...values,
    totalDue: values.totalInvoiced - values.totalReceived,
    netIncome: values.totalReceived - values.totalExpenses,
  };
}

function buildReceivedDateMatch(dateRange: DateRange) {
  if (Object.keys(dateRange).length === 0) return {};
  return { receivedDate: dateRange };
}

export async function getProjectFinancials(projectIds: string[], dateRange: DateRange = {}) {
  if (projectIds.length === 0) {
    return deriveMetrics({
      totalInvoiced: 0,
      totalExpenses: 0,
      totalVatAmount: 0,
      totalReceived: 0,
      invoiceCount: 0,
      expenseCount: 0,
      receivedCount: 0,
    });
  }

  const objectIds = projectIds.map((id) => new Types.ObjectId(id));
  const hasDateRange = Object.keys(dateRange).length > 0;

  const invoiceMatch: Record<string, unknown> = { projectId: { $in: objectIds } };
  const expenseMatch: Record<string, unknown> = { projectId: { $in: objectIds } };
  const receivedMatch: Record<string, unknown> = { projectId: { $in: objectIds }, ...buildReceivedDateMatch(dateRange) };

  if (hasDateRange) {
    invoiceMatch.invoiceDate = dateRange;
  }

  const [invoiceStats, expenseStats, receivedStats] = await Promise.all([
    InvoiceModel.aggregate([
      { $match: invoiceMatch },
      {
        $group: {
          _id: null,
          totalInvoiced: { $sum: invoiceGrossTotalExpression },
          totalVatAmount: { $sum: "$vatAmount" },
          invoiceCount: { $sum: 1 },
        },
      },
    ]),
    ExpenseModel.aggregate([
      { $match: expenseMatch },
      { $unwind: "$entries" },
      ...(hasDateRange ? [{ $match: { "entries.date": dateRange } }] : []),
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: "$entries.amount" },
          expenseCount: { $sum: 1 },
        },
      },
    ]),
    ReceivedAmountModel.aggregate([
      { $match: receivedMatch },
      {
        $group: {
          _id: null,
          totalReceived: { $sum: "$amount" },
          receivedCount: { $sum: 1 },
        },
      },
    ]),
  ]);

  return deriveMetrics({
    totalInvoiced: invoiceStats[0]?.totalInvoiced ?? 0,
    totalExpenses: expenseStats[0]?.totalExpenses ?? 0,
    totalVatAmount: invoiceStats[0]?.totalVatAmount ?? 0,
    totalReceived: receivedStats[0]?.totalReceived ?? 0,
    invoiceCount: invoiceStats[0]?.invoiceCount ?? 0,
    expenseCount: expenseStats[0]?.expenseCount ?? 0,
    receivedCount: receivedStats[0]?.receivedCount ?? 0,
  });
}

export async function getProjectFinancialsMap(projectIds: string[], dateRange: DateRange = {}) {
  if (projectIds.length === 0) {
    return new Map<string, ProjectFinancialMetrics>();
  }

  const objectIds = projectIds.map((id) => new Types.ObjectId(id));
  const hasDateRange = Object.keys(dateRange).length > 0;

  const invoiceMatch: Record<string, unknown> = { projectId: { $in: objectIds } };
  const expenseMatch: Record<string, unknown> = { projectId: { $in: objectIds } };
  const receivedMatch: Record<string, unknown> = { projectId: { $in: objectIds }, ...buildReceivedDateMatch(dateRange) };

  if (hasDateRange) {
    invoiceMatch.invoiceDate = dateRange;
  }

  const [invoiceByProject, expenseByProject, receivedByProject] = await Promise.all([
    InvoiceModel.aggregate([
      { $match: invoiceMatch },
      {
        $group: {
          _id: "$projectId",
          totalInvoiced: { $sum: invoiceGrossTotalExpression },
          totalVatAmount: { $sum: "$vatAmount" },
        },
      },
    ]),
    ExpenseModel.aggregate([
      { $match: expenseMatch },
      { $unwind: "$entries" },
      ...(hasDateRange ? [{ $match: { "entries.date": dateRange } }] : []),
      {
        $group: {
          _id: "$projectId",
          totalExpenses: { $sum: "$entries.amount" },
        },
      },
    ]),
    ReceivedAmountModel.aggregate([
      { $match: receivedMatch },
      {
        $group: {
          _id: "$projectId",
          totalReceived: { $sum: "$amount" },
        },
      },
    ]),
  ]);

  const map = new Map<string, ProjectFinancialMetrics>();

  for (const id of projectIds) {
    map.set(
      id,
      deriveMetrics({
        totalInvoiced: 0,
        totalExpenses: 0,
        totalVatAmount: 0,
        totalReceived: 0,
        invoiceCount: 0,
        expenseCount: 0,
        receivedCount: 0,
      }),
    );
  }

  for (const row of invoiceByProject) {
    const key = row._id.toString();
    const existing = map.get(key)!;
    map.set(key, deriveMetrics({ ...existing, totalInvoiced: row.totalInvoiced, totalVatAmount: row.totalVatAmount }));
  }

  for (const row of expenseByProject) {
    const key = row._id.toString();
    const existing = map.get(key)!;
    map.set(key, deriveMetrics({ ...existing, totalExpenses: row.totalExpenses }));
  }

  for (const row of receivedByProject) {
    const key = row._id.toString();
    const existing = map.get(key)!;
    map.set(key, deriveMetrics({ ...existing, totalReceived: row.totalReceived }));
  }

  return map;
}

export async function getReceivedAmountsForInvoice(invoiceId: string) {
  return ReceivedAmountModel.find({ invoiceId }).sort({ createdAt: -1 }).lean();
}
