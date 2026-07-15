import Papa from "papaparse";
import * as XLSX from "xlsx";

export type ParsedTradeRow = {
  date: Date;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  reference?: string;
  rawExtractedData?: Record<string, unknown>;
};

function parseNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 0;
  const cleaned = value.replace(/,/g, "").trim();
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "number") {
    const excelDate = XLSX.SSF.parse_date_code(value);
    if (excelDate) {
      return new Date(excelDate.y, excelDate.m - 1, excelDate.d);
    }
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

function normalizeRow(row: Record<string, unknown>): ParsedTradeRow | null {
  const keys = Object.keys(row);
  const findKey = (candidates: string[]) =>
    keys.find((key) => candidates.some((candidate) => key.toLowerCase().includes(candidate.toLowerCase())));

  const dateKey = findKey(["date", "transaction date", "txn date"]);
  const descriptionKey = findKey(["description", "narration", "details", "particulars"]);
  const debitKey = findKey(["debit", "withdrawal", "dr"]);
  const creditKey = findKey(["credit", "deposit", "cr"]);
  const balanceKey = findKey(["balance", "running balance"]);
  const referenceKey = findKey(["reference", "ref", "cheque"]);

  const description = String(row[descriptionKey ?? "description"] ?? row[keys[1] ?? ""] ?? "Transaction").trim();

  if (!description) return null;

  const debit = parseNumber(row[debitKey ?? "debit"]);
  const credit = parseNumber(row[creditKey ?? "credit"]);
  const balance = parseNumber(row[balanceKey ?? "balance"]);

  return {
    date: parseDate(row[dateKey ?? "date"]),
    description,
    debit,
    credit,
    balance,
    reference: referenceKey ? String(row[referenceKey] ?? "").trim() || undefined : undefined,
    rawExtractedData: row,
  };
}

export async function parseCsvBuffer(buffer: Buffer) {
  const text = buffer.toString("utf-8");
  const parsed = Papa.parse<Record<string, unknown>>(text, { header: true, skipEmptyLines: true });
  return parsed.data.map((row) => normalizeRow(row)).filter((row): row is ParsedTradeRow => row !== null);
}

export function parseXlsxBuffer(buffer: Buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  return rows.map(normalizeRow).filter((row): row is ParsedTradeRow => row !== null);
}

export async function parsePdfBuffer(buffer: Buffer) {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();

  const lines = result.text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const rows: ParsedTradeRow[] = [];

  for (const line of lines) {
    const parts = line.split(/\s{2,}|\t|,/).map((part) => part.trim()).filter(Boolean);
    if (parts.length < 3) continue;

    const numbers = parts.map(parseNumber).filter((n) => n !== 0);
    if (numbers.length === 0) continue;

    rows.push({
      date: parseDate(parts[0]),
      description: parts.slice(1, -2).join(" ") || parts[1] || "Transaction",
      debit: numbers.length >= 2 ? numbers[numbers.length - 2] : 0,
      credit: numbers.length >= 1 ? numbers[numbers.length - 1] : 0,
      balance: numbers[numbers.length - 1] ?? 0,
      rawExtractedData: { line, parts },
    });
  }

  return rows;
}

export async function parseTradeFile(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "csv") {
    return parseCsvBuffer(buffer);
  }

  if (extension === "xlsx" || extension === "xls") {
    return parseXlsxBuffer(buffer);
  }

  if (extension === "pdf") {
    return parsePdfBuffer(buffer);
  }

  throw new Error("Unsupported file type. Use PDF, CSV, or XLSX.");
}
