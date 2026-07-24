export function formatCurrency(amount: number, currency = "SAR") {
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatOptionalDate(value?: string | Date | null) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime()) || date.getFullYear() < 1971) return "—";
  return formatDate(date);
}

export function truncate(text: string, length = 60) {
  if (text.length <= length) return text;
  return `${text.slice(0, length)}…`;
}
