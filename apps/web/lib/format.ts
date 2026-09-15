import type { SaleStatus } from "@sales/shared";
import { SALE_STATUS_LABELS } from "@sales/shared";

export function formatMoney(value: string | number) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) {
    return "$0.00";
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export function formatKpiValue(label: string, value: string) {
  if (value.trim().startsWith("$")) {
    return value;
  }
  if (/revenue|price|amount/i.test(label)) {
    return formatMoney(value);
  }
  return value;
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function statusLabel(status: SaleStatus) {
  return SALE_STATUS_LABELS[status];
}

export function customerName(first: string, last: string) {
  return `${first} ${last}`.trim();
}
