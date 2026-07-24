import * as XLSX from "xlsx";

type SheetCell = XLSX.CellObject;

const CURRENCY_FORMAT = '#,##0.00" SAR"';
const DATE_FORMAT = "dd/mm/yyyy";

export function normalizeOptionalDate(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime()) || date.getFullYear() < 1971) return null;
  return date;
}

export function formatDisplayDate(value: Date | string | null | undefined) {
  const date = normalizeOptionalDate(value);
  if (!date) return "";
  return date.toLocaleDateString("en-GB");
}

function setCell(sheet: XLSX.WorkSheet, address: string, value: string | number, format?: string) {
  const cell: SheetCell = { v: value, t: typeof value === "number" ? "n" : "s" };
  if (format) cell.z = format;
  sheet[address] = cell;
}

function setColumnWidths(sheet: XLSX.WorkSheet, widths: number[]) {
  sheet["!cols"] = widths.map((width) => ({ wch: width }));
}

function applyCurrencyFormat(sheet: XLSX.WorkSheet, columnLetters: string[], startRow: number, endRow: number) {
  for (let row = startRow; row <= endRow; row += 1) {
    for (const column of columnLetters) {
      const address = `${column}${row}`;
      const cell = sheet[address];
      if (cell && cell.t === "n") {
        cell.z = CURRENCY_FORMAT;
      }
    }
  }
}

function applyDateFormat(sheet: XLSX.WorkSheet, columnLetters: string[], startRow: number, endRow: number) {
  for (let row = startRow; row <= endRow; row += 1) {
    for (const column of columnLetters) {
      const address = `${column}${row}`;
      const cell = sheet[address];
      if (cell && cell.t === "n") {
        cell.z = DATE_FORMAT;
      }
    }
  }
}

export function buildSummaryWorksheet(input: {
  reportTitle: string;
  generatedAt: string;
  filters: Array<[string, string | number]>;
  metrics: Array<{ label: string; value: number; format?: "currency" | "integer" }>;
}) {
  const sheet: XLSX.WorkSheet = {};
  let row = 1;

  setCell(sheet, `A${row}`, input.reportTitle);
  row += 1;
  setCell(sheet, `A${row}`, `Generated: ${input.generatedAt}`);
  row += 2;

  setCell(sheet, `A${row}`, "FILTERS");
  row += 1;
  setCell(sheet, `A${row}`, "Filter");
  setCell(sheet, `B${row}`, "Value");
  const filterHeaderRow = row;
  row += 1;

  for (const [label, value] of input.filters) {
    setCell(sheet, `A${row}`, label);
    setCell(sheet, `B${row}`, value);
    row += 1;
  }

  row += 1;
  setCell(sheet, `A${row}`, "FINANCIAL SUMMARY");
  row += 1;
  setCell(sheet, `A${row}`, "Metric");
  setCell(sheet, `B${row}`, "Amount (SAR)");
  const metricHeaderRow = row;
  row += 1;

  const metricStartRow = row;
  for (const metric of input.metrics) {
    setCell(sheet, `A${row}`, metric.label, undefined);
    if (metric.format === "integer") {
      setCell(sheet, `B${row}`, metric.value, "0");
    } else {
      setCell(sheet, `B${row}`, Number(metric.value.toFixed(2)), CURRENCY_FORMAT);
    }
    row += 1;
  }

  sheet["!ref"] = `A1:B${row - 1}`;
  setColumnWidths(sheet, [34, 22]);

  for (let rowIndex = metricStartRow; rowIndex <= row - 1; rowIndex += 1) {
    const metric = input.metrics[rowIndex - metricStartRow];
    if (metric?.format !== "integer") {
      const cell = sheet[`B${rowIndex}`];
      if (cell && cell.t === "n") cell.z = CURRENCY_FORMAT;
    }
  }

  sheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
  sheet["!freeze"] = { xSplit: 0, ySplit: filterHeaderRow, topLeftCell: `A${filterHeaderRow + 1}`, activePane: "bottomLeft" };

  return sheet;
}

export function buildTableWorksheet<T extends Record<string, string | number>>(
  rows: T[],
  options: {
    currencyColumns?: string[];
    dateColumns?: string[];
    columnWidths?: number[];
  } = {},
) {
  const sheet = XLSX.utils.json_to_sheet(rows);
  const range = XLSX.utils.decode_range(sheet["!ref"] ?? "A1:A1");
  const headerRow = range.s.r + 1;
  const dataStartRow = headerRow + 1;
  const dataEndRow = range.e.r + 1;

  if (options.columnWidths) {
    setColumnWidths(sheet, options.columnWidths);
  }

  if (options.currencyColumns?.length) {
    const letters = options.currencyColumns.map((column) => {
      const index = Object.keys(rows[0] ?? {}).indexOf(column);
      return index >= 0 ? XLSX.utils.encode_col(index) : null;
    }).filter(Boolean) as string[];
    applyCurrencyFormat(sheet, letters, dataStartRow, dataEndRow);
  }

  if (options.dateColumns?.length) {
    const letters = options.dateColumns.map((column) => {
      const index = Object.keys(rows[0] ?? {}).indexOf(column);
      return index >= 0 ? XLSX.utils.encode_col(index) : null;
    }).filter(Boolean) as string[];
    applyDateFormat(sheet, letters, dataStartRow, dataEndRow);
  }

  sheet["!autofilter"] = { ref: XLSX.utils.encode_range(range) };
  sheet["!freeze"] = { xSplit: 0, ySplit: headerRow, topLeftCell: `A${dataStartRow}`, activePane: "bottomLeft" };

  return sheet;
}

export function writeWorkbookBuffer(
  sheets: Array<{ name: string; sheet: XLSX.WorkSheet }>,
) {
  const workbook = XLSX.utils.book_new();
  for (const entry of sheets) {
    XLSX.utils.book_append_sheet(workbook, entry.sheet, entry.name);
  }
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}
