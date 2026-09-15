"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Customer, ListResponse, Sale } from "@sales/shared";
import { StatusChip } from "@/components/status-chip";
import { Card } from "@/components/ui/card";
import { api, apiData } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { qk } from "@/lib/query-keys";

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const customer = useQuery({
    queryKey: qk.customer(params.id),
    queryFn: () => apiData<Customer>(`/api/customers/${params.id}`),
  });
  const sales = useQuery({
    queryKey: qk.sales({ customerId: params.id }),
    queryFn: () => api<ListResponse<Sale>>(`/api/sales?customerId=${params.id}&pageSize=50`),
  });

  const c = customer.data;
  if (!c) {
    return <p className="text-sm text-ink-muted">{customer.isError ? "Customer not found." : "Loading…"}</p>;
  }

  return (
    <div>
      <Link href="/customers" className="text-sm text-ink-muted hover:text-copper">
        ← Customers
      </Link>
      <h1 className="mt-3 text-2xl font-medium tracking-tight">
        {c.firstName} {c.lastName}
      </h1>
      <Card className="mt-5 max-w-xl space-y-1 text-sm">
        <p className="font-mono">{c.email}</p>
        <p>{c.phone}</p>
        <p className="text-ink-muted">{c.address}</p>
      </Card>
      <h2 className="mt-8 text-lg font-medium">Sales</h2>
      <ul className="mt-3 divide-y divide-line rounded-[10px] border border-line bg-panel">
        {sales.data?.data.map((s) => (
          <li key={s.id} className="flex items-center justify-between px-4 py-2.5">
            <div>
              <p>{s.productName}</p>
              <p className="font-mono text-xs text-copper">{formatMoney(s.price)}</p>
            </div>
            <StatusChip status={s.status} />
          </li>
        ))}
        {sales.data?.data.length === 0 ? <li className="px-4 py-6 text-sm text-ink-muted">No sales yet.</li> : null}
      </ul>
    </div>
  );
}
