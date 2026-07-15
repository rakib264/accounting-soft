import { Types } from "mongoose";

import { ExpenseModel } from "@/models/Expense";
import { InvoiceModel } from "@/models/Invoice";

export async function getProjectFinancials(projectIds: string[]) {
  if (projectIds.length === 0) {
    return {
      totalInvoiced: 0,
      totalExpenses: 0,
      invoiceCount: 0,
      expenseCount: 0,
    };
  }

  const objectIds = projectIds.map((id) => new Types.ObjectId(id));

  const [invoiceStats, expenseStats] = await Promise.all([
    InvoiceModel.aggregate([
      { $match: { projectId: { $in: objectIds } } },
      {
        $group: {
          _id: null,
          totalInvoiced: { $sum: "$total" },
          invoiceCount: { $sum: 1 },
        },
      },
    ]),
    ExpenseModel.aggregate([
      { $match: { projectId: { $in: objectIds } } },
      { $unwind: "$entries" },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: "$entries.amount" },
          expenseCount: { $sum: 1 },
        },
      },
    ]),
  ]);

  return {
    totalInvoiced: invoiceStats[0]?.totalInvoiced ?? 0,
    totalExpenses: expenseStats[0]?.totalExpenses ?? 0,
    invoiceCount: invoiceStats[0]?.invoiceCount ?? 0,
    expenseCount: expenseStats[0]?.expenseCount ?? 0,
  };
}

export async function getProjectFinancialsMap(projectIds: string[]) {
  if (projectIds.length === 0) {
    return new Map<string, { totalInvoiced: number; totalExpenses: number }>();
  }

  const objectIds = projectIds.map((id) => new Types.ObjectId(id));

  const [invoiceByProject, expenseByProject] = await Promise.all([
    InvoiceModel.aggregate([
      { $match: { projectId: { $in: objectIds } } },
      {
        $group: {
          _id: "$projectId",
          totalInvoiced: { $sum: "$total" },
        },
      },
    ]),
    ExpenseModel.aggregate([
      { $match: { projectId: { $in: objectIds } } },
      { $unwind: "$entries" },
      {
        $group: {
          _id: "$projectId",
          totalExpenses: { $sum: "$entries.amount" },
        },
      },
    ]),
  ]);

  const map = new Map<string, { totalInvoiced: number; totalExpenses: number }>();

  for (const id of projectIds) {
    map.set(id, { totalInvoiced: 0, totalExpenses: 0 });
  }

  for (const row of invoiceByProject) {
    const key = row._id.toString();
    const existing = map.get(key) ?? { totalInvoiced: 0, totalExpenses: 0 };
    map.set(key, { ...existing, totalInvoiced: row.totalInvoiced });
  }

  for (const row of expenseByProject) {
    const key = row._id.toString();
    const existing = map.get(key) ?? { totalInvoiced: 0, totalExpenses: 0 };
    map.set(key, { ...existing, totalExpenses: row.totalExpenses });
  }

  return map;
}
