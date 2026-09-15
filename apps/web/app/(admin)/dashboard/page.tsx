"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import type { Dashboard } from "@sales/shared";
import { StatusChip } from "@/components/status-chip";
import { Card } from "@/components/ui/card";
import { apiData } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/format";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const dash = useQuery({
    queryKey: qk.dashboard,
    queryFn: () => apiData<Dashboard>("/api/dashboard"),
  });

  const data = dash.data;
  const kpis = data
    ? [
        { label: "Customers", value: String(data.totalCustomers) },
        { label: "Sales", value: String(data.totalSales) },
        { label: "Revenue", value: formatMoney(data.totalRevenue), money: true },
      ]
    : [];

  return (
    <div>
      <h1 className="text-2xl font-medium tracking-tight">Dashboard</h1>
      <p className="mt-1 text-sm text-ink-muted">Closed revenue counts completed sales only.</p>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {kpis.map((k) => (
          <Card key={k.label} className={cn("hover:-translate-y-0.5 hover:shadow-float", k.money && "border-t-[3px] border-t-copper")}>
            <p className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">{k.label}</p>
            <p className={cn("mt-2 text-[28px] leading-none tracking-tight tabular-nums", k.money && "text-copper")}>{k.value}</p>
          </Card>
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <p className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">By status</p>
          <ul className="mt-3 space-y-2">
            {data
              ? (["new", "in_progress", "completed", "cancelled"] as const).map((status) => (
                  <li key={status} className="flex items-center justify-between">
                    <StatusChip status={status} />
                    <span
                      className={cn(
                        "font-mono text-sm",
                        status === "new" && "text-new",
                        status === "in_progress" && "text-progress",
                        status === "completed" && "text-success",
                        status === "cancelled" && "text-cancelled",
                      )}
                    >
                      {data.salesByStatus[status]}
                    </span>
                  </li>
                ))
              : null}
          </ul>
        </Card>
        <Card className="p-0">
          <div className="border-b border-line px-4 py-3 text-[11px] uppercase tracking-[0.14em] text-ink-muted">
            Recent sales
          </div>
          <ul>
            {data?.recentSales.map((sale) => (
              <li key={sale.id} className="flex flex-col gap-2 border-b border-line px-4 py-2.5 last:border-0 transition-colors duration-150 ease-ledger hover:bg-canvas/70 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm">{sale.productName}</p>
                  <p className="text-xs text-ink-muted">
                    {sale.customerName} · {formatDate(sale.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <span className="font-mono text-sm text-copper">{formatMoney(sale.price)}</span>
                  <StatusChip status={sale.status} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <p className="mt-6 text-sm text-ink-muted">
        Jump to the <Link className="text-copper underline-offset-4 transition-colors hover:text-copper-hover hover:underline" href="/pipeline">pipeline</Link> to move deals.
      </p>
    </div>
  );
}
