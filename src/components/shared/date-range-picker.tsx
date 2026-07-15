"use client";

import { CalendarIcon } from "lucide-react";
import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  const label = formatDateRangeLabel(value, placeholder);
  const hasValue = Boolean(value.from || value.to);

  function handleSelect(range: DateRange | undefined) {
    onChange(dateRangeToStrings(range));
    if (range?.from && range?.to) {
      setOpen(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
      <PopoverContent className="w-auto max-w-[calc(100vw-2rem)] overflow-x-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={selected}
          onSelect={handleSelect}
          numberOfMonths={2}
          defaultMonth={selected?.from}
          className="min-w-max"
        />
      </PopoverContent>
    </Popover>
  );
}
