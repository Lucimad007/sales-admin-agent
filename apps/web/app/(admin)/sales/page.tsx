"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  SALE_STATUSES,
  type Customer,
  type ListResponse,
  type Sale,
  type SaleCreate,
  type SaleStatus,
} from "@sales/shared";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, apiData, ApiError } from "@/lib/api";
import { formatDate, formatMoney, statusLabel } from "@/lib/format";
import { qk } from "@/lib/query-keys";

const emptySale = {
  customerId: "",
  productName: "",
  price: "",
  status: "new" as SaleStatus,
  notes: "",
};

export default function SalesPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<SaleStatus | "">("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Sale | null>(null);
  const [form, setForm] = useState(emptySale);

  const filters = useMemo(() => ({ q, status }), [q, status]);
  const list = useQuery({
    queryKey: qk.sales(filters),
    queryFn: () => {
      const params = new URLSearchParams({ q, pageSize: "50" });
      if (status) params.set("status", status);
      return api<ListResponse<Sale>>(`/api/sales?${params}`);
    },
  });
  const customers = useQuery({
    queryKey: qk.customers({ q: "", pageSize: 100 }),
    queryFn: () => api<ListResponse<Customer>>("/api/customers?pageSize=100"),
  });

  const save = useMutation({
    mutationFn: async () => {
      const body: SaleCreate = {
        customerId: form.customerId,
        productName: form.productName,
        price: form.price,
        status: form.status,
        notes: form.notes,
      };
      if (editing) {
        return apiData(`/api/sales/${editing.id}`, { method: "PATCH", body: JSON.stringify(body) });
      }
      return apiData("/api/sales", { method: "POST", body: JSON.stringify(body) });
    },
    onSuccess: () => {
      toast.success(editing ? "Sale updated" : "Sale created");
      setOpen(false);
      void qc.invalidateQueries({ queryKey: ["sales"] });
      void qc.invalidateQueries({ queryKey: qk.dashboard });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Save failed"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiData(`/api/sales/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Sale deleted");
      void qc.invalidateQueries({ queryKey: ["sales"] });
      void qc.invalidateQueries({ queryKey: qk.dashboard });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Delete failed"),
  });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Sales</h1>
          <p className="mt-1 text-sm text-ink-muted">{list.data?.meta.total ?? 0} records</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setForm({ ...emptySale, customerId: customers.data?.data[0]?.id ?? "" });
            setOpen(true);
          }}
        >
          New sale
        </Button>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <Input className="max-w-sm" placeholder="Search product or notes" value={q} onChange={(e) => setQ(e.target.value)} />
        <select
          className="ledger-select"
          value={status}
          onChange={(e) => setStatus(e.target.value as SaleStatus | "")}
        >
          <option value="">All statuses</option>
          {SALE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-4 overflow-hidden rounded-[12px] border border-line bg-panel shadow-lift">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-canvas/80 text-[11px] uppercase tracking-[0.12em] text-ink-muted">
            <tr>
              <th className="px-4 py-2.5">Product</th>
              <th className="px-4 py-2.5">Customer</th>
              <th className="px-4 py-2.5">Price</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Created</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {list.data?.data.map((s) => (
              <tr key={s.id} className="border-b border-line last:border-0 transition-colors duration-150 ease-ledger hover:bg-canvas/70">
                <td className="px-4 py-2.5">{s.productName}</td>
                <td className="px-4 py-2.5">
                  {s.customer ? `${s.customer.firstName} ${s.customer.lastName}` : "—"}
                </td>
                <td className="px-4 py-2.5 font-mono text-copper">{formatMoney(s.price)}</td>
                <td className="px-4 py-2.5">
                  <StatusChip status={s.status} />
                </td>
                <td className="px-4 py-2.5 text-ink-muted">{formatDate(s.createdAt)}</td>
                <td className="px-4 py-2.5 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditing(s);
                      setForm({
                        customerId: s.customerId,
                        productName: s.productName,
                        price: s.price,
                        status: s.status,
                        notes: s.notes,
                      });
                      setOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button variant="danger-ghost" size="sm" onClick={() => remove.mutate(s.id)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.data?.data.length === 0 ? <p className="px-4 py-8 text-sm text-ink-muted">No sales match.</p> : null}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>{editing ? "Edit sale" : "New sale"}</DialogTitle>
          <DialogDescription>Price is stored as a decimal, not a float.</DialogDescription>
          <form
            className="mt-4 grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
          >
            <div className="space-y-1.5">
              <Label>Customer</Label>
              <select
                className="ledger-select w-full"
                value={form.customerId}
                onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                required
              >
                <option value="" disabled>
                  Select
                </option>
                {customers.data?.data.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Product / service</Label>
              <Input value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Price</Label>
                <Input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <select
                  className="ledger-select w-full"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as SaleStatus })}
                >
                  {SALE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {statusLabel(s)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="mt-2 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={save.isPending}>
                Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
