import { format, isValid, parseISO } from "date-fns";
import type { DateRange } from "react-day-picker";

export type DateRangeStrings = {
  from: string;
  to: string;
};

export const EMPTY_DATE_RANGE: DateRangeStrings = { from: "", to: "" };

export function toApiDate(date: Date | undefined): string {
  return date ? format(date, "yyyy-MM-dd") : "";
}

export function parseApiDate(value: string): Date | undefined {
  if (!value) return undefined;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : undefined;
}

export function stringsToDateRange(value: DateRangeStrings): DateRange | undefined {
  const from = parseApiDate(value.from);
  const to = parseApiDate(value.to);
  if (!from && !to) return undefined;
  return { from, to };
}

export function dateRangeToStrings(range: DateRange | undefined): DateRangeStrings {
  return {
    from: toApiDate(range?.from),
    to: toApiDate(range?.to),
  };
}

export function formatDateRangeLabel(value: DateRangeStrings, placeholder = "Select date range"): string {
  const from = parseApiDate(value.from);
  const to = parseApiDate(value.to);

  if (from && to) {
    return `${format(from, "dd MMM yyyy")} – ${format(to, "dd MMM yyyy")}`;
  }
  if (from) {
    return `${format(from, "dd MMM yyyy")} – …`;
  }
  if (to) {
    return `… – ${format(to, "dd MMM yyyy")}`;
  }
  return placeholder;
}
