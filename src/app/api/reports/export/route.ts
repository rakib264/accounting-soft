import { NextRequest } from "next/server";
import { Types } from "mongoose";

import {
  buildSummaryWorksheet,
  buildTableWorksheet,
  formatDisplayDate,
  normalizeOptionalDate,
  writeWorkbookBuffer,
} from "@/lib/api/excel-export";
import { invoiceGrossTotalExpression } from "@/lib/api/invoice-totals";
import { getProjectFinancials, getProjectFinancialsMap } from "@/lib/api/reporting";
import { withRouteGuard } from "@/lib/api/route-guard";
import { connectToDatabase } from "@/lib/db";
import { ProjectModel } from "@/models/Project";
import { ReceivedAmountModel } from "@/models/ReceivedAmount";

function parseDateRange(request: NextRequest) {
  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");
  return {
    ...(from ? { $gte: new Date(from) } : {}),
    ...(to ? { $lte: new Date(to) } : {}),
  };
}

function formatMoney(value: number | null | undefined) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return 0;
  return Number(numeric.toFixed(2));
}

function businessTypeLabel(value: string | null) {
  if (value === "manpower") return "Man-power";
  if (value === "subcontract") return "Sub-contract";
  if (value === "trade") return "Trade";
  return "Both";
}

async function exportModuleReport(request: NextRequest) {
  await connectToDatabase();

  const searchParams = request.nextUrl.searchParams;
  const businessType = searchParams.get("businessType");
  const projectId = searchParams.get("projectId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const dateRange = parseDateRange(request);

  const projectQuery: Record<string, unknown> = {};
  if (businessType === "manpower" || businessType === "subcontract" || businessType === "trade") {
    projectQuery.businessType = businessType;
  }
  if (projectId) {
    projectQuery._id = projectId;
  }

  const projects = await ProjectModel.find(projectQuery).sort({ createdAt: -1 }).lean();
  const projectIds = projects.map((project) => project._id.toString());
  const objectIds = projectIds.map((id) => new Types.ObjectId(id));

  const financials = await getProjectFinancials(projectIds, dateRange);
  const financialsMap = await getProjectFinancialsMap(projectIds, dateRange);

  const receivedMatch: Record<string, unknown> = { projectId: { $in: objectIds } };
  if (Object.keys(dateRange).length > 0) {
    receivedMatch.receivedDate = dateRange;
  }

  const receivedRows = await ReceivedAmountModel.aggregate([
    { $match: receivedMatch },
    {
      $lookup: {
        from: "invoices",
        localField: "invoiceId",
        foreignField: "_id",
        as: "invoice",
      },
    },
    { $unwind: "$invoice" },
    {
      $lookup: {
        from: "projects",
        localField: "projectId",
        foreignField: "_id",
        as: "project",
      },
    },
    { $unwind: "$project" },
    { $sort: { "invoice._id": 1, createdAt: 1 } },
    {
      $project: {
        invoiceId: "$invoiceId",
        projectName: "$project.name",
        businessType: "$project.businessType",
        invoiceDate: "$invoice.invoiceDate",
        invoiceLabel: {
          $reduce: {
            input: "$invoice.lineItems.label",
            initialValue: "",
            in: {
              $cond: [{ $eq: ["$$value", ""] }, "$$this", { $concat: ["$$value", ", ", "$$this"] }],
            },
          },
        },
        invoiceTotal: invoiceGrossTotalExpression,
        amount: 1,
        receivedDate: 1,
        createdAt: 1,
      },
    },
  ]);

  const runningByInvoice = new Map<string, number>();
  const receivedSheetRows = receivedRows.map((row) => {
    const invoiceKey = row.invoiceId.toString();
    const invoiceTotal = Number(row.invoiceTotal ?? 0);
    const paymentAmount = Number(row.amount ?? 0);
    const previousTotal = runningByInvoice.get(invoiceKey) ?? 0;
    const totalReceivedOnInvoice = previousTotal + paymentAmount;
    runningByInvoice.set(invoiceKey, totalReceivedOnInvoice);

    return {
      Project: row.projectName,
      "Business Type": businessTypeLabel(row.businessType),
      "Invoice Date": formatDisplayDate(row.invoiceDate),
      "Invoice Label": row.invoiceLabel,
      "Invoice Total (incl. VAT)": formatMoney(invoiceTotal),
      "Payment Amount": formatMoney(paymentAmount),
      "Total Received on Invoice": formatMoney(totalReceivedOnInvoice),
      "Balance Due on Invoice": formatMoney(invoiceTotal - totalReceivedOnInvoice),
      "Received Date": formatDisplayDate(normalizeOptionalDate(row.receivedDate)),
      "Recorded At": formatDisplayDate(row.createdAt),
    };
  });

  const reportTitle =
    businessType === "manpower"
      ? "Man-power & Sub-contract Report — Man-power"
      : businessType === "subcontract"
        ? "Man-power & Sub-contract Report — Sub-contract"
        : businessType === "trade"
          ? "Trade Report"
        : "Man-power & Sub-contract Report — Collective";

  const summarySheet = buildSummaryWorksheet({
    reportTitle,
    generatedAt: new Date().toLocaleString("en-GB"),
    filters: [
      ["Business Type", businessTypeLabel(businessType)],
      ["Project", projectId ? projects[0]?.name ?? projectId : "All projects"],
      ["Date From", from || "All dates"],
      ["Date To", to || "All dates"],
    ],
    metrics: [
      { label: "Total Projects", value: projectIds.length, format: "integer" },
      { label: "Total Invoices", value: financials.invoiceCount, format: "integer" },
      { label: "Total Invoice Amount (incl. VAT)", value: financials.totalInvoiced },
      { label: "Total VAT", value: financials.totalVatAmount },
      { label: "Total Received", value: financials.totalReceived },
      { label: "Total Due", value: financials.totalDue },
      { label: "Total Expenses", value: financials.totalExpenses },
      { label: "Net Income", value: financials.netIncome },
    ],
  });

  const projectsSheet = buildTableWorksheet(
    projects.map((project) => {
      const metrics = financialsMap.get(project._id.toString())!;
      return {
        Project: project.name,
        "Business Type": businessTypeLabel(project.businessType),
        Details: project.details,
        "Invoice Amount (incl. VAT)": formatMoney(metrics.totalInvoiced),
        "Total VAT": formatMoney(metrics.totalVatAmount),
        "Total Received": formatMoney(metrics.totalReceived),
        "Total Due": formatMoney(metrics.totalDue),
        "Total Expenses": formatMoney(metrics.totalExpenses),
        "Net Income": formatMoney(metrics.netIncome),
        Created: formatDisplayDate(project.createdAt),
      };
    }),
    {
      currencyColumns: [
        "Invoice Amount (incl. VAT)",
        "Total VAT",
        "Total Received",
        "Total Due",
        "Total Expenses",
        "Net Income",
      ],
      dateColumns: ["Created"],
      columnWidths: [24, 16, 34, 20, 14, 16, 16, 14, 16, 14, 14],
    },
  );

  const receivedSheet = buildTableWorksheet(receivedSheetRows, {
    currencyColumns: [
      "Invoice Total (incl. VAT)",
      "Payment Amount",
      "Total Received on Invoice",
      "Balance Due on Invoice",
    ],
    dateColumns: ["Invoice Date", "Received Date", "Recorded At"],
    columnWidths: [22, 16, 14, 24, 20, 16, 22, 22, 14, 14],
  });

  const buffer = writeWorkbookBuffer([
    { name: "Summary", sheet: summarySheet },
    { name: "Projects", sheet: projectsSheet },
    { name: "Received Amounts", sheet: receivedSheet },
  ]);

  const filename = `${(businessType || "collective").replace(/[^a-z0-9-]/gi, "-")}-report-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

export const GET = withRouteGuard(exportModuleReport, {
  requirePermission: { module: "manpowerSubcontract", action: "view" },
});
