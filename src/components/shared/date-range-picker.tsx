"use client";

import { CalendarIcon } from "lucide-react";
import { addMonths, format, getMonth, getYear, setMonth, setYear } from "date-fns";
import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select } from "@/components/ui/select";
import {
  DateRangeStrings,
  dateRangeToStrings,
  formatDateRangeLabel,
  stringsToDateRange,
} from "@/lib/date-range";
import { cn } from "@/lib/utils";

type DateRangePickerProps = {
  value: DateRangeStrings;
  onChange: (value: DateRangeStrings) => void;
  placeholder?: string;
  className?: string;
  id?: string;
};

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Select date range",
  className,
  id,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => stringsToDateRange(value), [value]);
  const [viewMonth, setViewMonth] = useState<Date>(selected?.from ?? new Date());
  const label = formatDateRangeLabel(value, placeholder);
  const hasValue = Boolean(value.from || value.to);
  const monthNames = useMemo(() => Array.from({ length: 12 }, (_, index) => format(new Date(2026, index, 1), "MMMM")), []);
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 61 }, (_, index) => currentYear - 30 + index);
  }, []);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setViewMonth(selected?.from ?? new Date());
    }
    setOpen(nextOpen);
  }

  function handleSelect(range: DateRange | undefined) {
    onChange(dateRangeToStrings(range));
    if (range?.from && range?.to) {
      setOpen(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          className={cn(
            "field-control justify-between gap-2 text-left font-medium",
            !hasValue && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">{label}</span>
          <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground/80" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto max-w-[calc(100vw-2rem)] overflow-x-auto p-3" align="start">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 bg-muted/30 px-3 py-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-md border border-border bg-card px-2 py-1 text-sm hover:bg-accent"
              onClick={() => setViewMonth((current) => addMonths(current, -1))}
              aria-label="Previous month"
            >
              {"<"}
            </button>
            <button
              type="button"
              className="rounded-md border border-border bg-card px-2 py-1 text-sm hover:bg-accent"
              onClick={() => setViewMonth((current) => addMonths(current, 1))}
              aria-label="Next month"
            >
              {">"}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Select
              aria-label="Select month"
              value={String(getMonth(viewMonth))}
              onChange={(event) => setViewMonth((current) => setMonth(current, Number(event.target.value)))}
              className="h-9 min-w-38 py-0 text-sm"
            >
              {monthNames.map((monthName, index) => (
                <option key={monthName} value={index}>
                  {monthName}
                </option>
              ))}
            </Select>
            <Select
              aria-label="Select year"
              value={String(getYear(viewMonth))}
              onChange={(event) => setViewMonth((current) => setYear(current, Number(event.target.value)))}
              className="h-9 min-w-26 py-0 text-sm"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <Calendar
          mode="range"
          selected={selected}
          onSelect={handleSelect}
          numberOfMonths={2}
          pagedNavigation
          hideNavigation
          month={viewMonth}
          onMonthChange={setViewMonth}
          className="min-w-max p-0"
        />
      </PopoverContent>
    </Popover>
  );
}
