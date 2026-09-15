"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import type { Customer, CustomerWrite, ListResponse } from "@sales/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, apiData, ApiError } from "@/lib/api";
import { qk } from "@/lib/query-keys";

const empty: CustomerWrite = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  address: "",
};

export default function CustomersPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerWrite>(empty);

  const list = useQuery({
    queryKey: qk.customers({ q }),
    queryFn: () => api<ListResponse<Customer>>(`/api/customers?q=${encodeURIComponent(q)}&pageSize=50`),
  });

  const save = useMutation({
    mutationFn: async () => {
      if (editing) {
        return apiData(`/api/customers/${editing.id}`, { method: "PATCH", body: JSON.stringify(form) });
      }
      return apiData("/api/customers", { method: "POST", body: JSON.stringify(form) });
    },
    onSuccess: () => {
      toast.success(editing ? "Customer updated" : "Customer added");
      setOpen(false);
      void qc.invalidateQueries({ queryKey: ["customers"] });
      void qc.invalidateQueries({ queryKey: qk.dashboard });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Save failed"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiData(`/api/customers/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Customer deleted");
      void qc.invalidateQueries({ queryKey: ["customers"] });
      void qc.invalidateQueries({ queryKey: qk.dashboard });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Delete failed"),
  });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Customers</h1>
          <p className="mt-1 text-sm text-ink-muted">{list.data?.meta.total ?? 0} in the book</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setForm(empty);
            setOpen(true);
          }}
        >
          Add customer
        </Button>
      </div>
      <Input
        className="mt-5 w-full"
        placeholder="Search name, email, phone"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <ul className="mt-4 space-y-2 lg:hidden">
        {list.data?.data.map((c) => (
          <li key={c.id} className="rounded-[12px] border border-line bg-panel p-3 shadow-paper">
            <Link className="text-sm font-medium transition-colors hover:text-copper" href={`/customers/${c.id}`}>
              {c.firstName} {c.lastName}
            </Link>
            <p className="mt-1 break-all font-mono text-[12px] text-ink">{c.email}</p>
            <p className="mt-0.5 text-sm text-ink-muted">{c.phone}</p>
            <div className="-ml-2 mt-2 flex flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditing(c);
                  setForm({
                    firstName: c.firstName,
                    lastName: c.lastName,
                    phone: c.phone,
                    email: c.email,
                    address: c.address,
                  });
                  setOpen(true);
                }}
              >
                Edit
              </Button>
              <Button variant="danger-ghost" size="sm" onClick={() => remove.mutate(c.id)}>
                Delete
              </Button>
            </div>
          </li>
        ))}
        {list.data?.data.length === 0 ? (
          <li className="rounded-[12px] border border-line bg-panel px-4 py-8 text-sm text-ink-muted">No customers match.</li>
        ) : null}
      </ul>
      <div className="mt-4 hidden overflow-hidden rounded-[12px] border border-line bg-panel shadow-lift lg:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-canvas/80 text-[11px] uppercase tracking-[0.12em] text-ink-muted">
            <tr>
              <th className="px-4 py-2.5">Name</th>
              <th className="px-4 py-2.5">Email</th>
              <th className="px-4 py-2.5">Phone</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {list.data?.data.map((c) => (
              <tr key={c.id} className="border-b border-line last:border-0 transition-colors duration-150 ease-ledger hover:bg-canvas/70">
                <td className="px-4 py-2.5">
                  <Link className="transition-colors hover:text-copper" href={`/customers/${c.id}`}>
                    {c.firstName} {c.lastName}
                  </Link>
                </td>
                <td className="px-4 py-2.5 font-mono text-[12px]">{c.email}</td>
                <td className="px-4 py-2.5">{c.phone}</td>
                <td className="px-4 py-2.5 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditing(c);
                      setForm({
                        firstName: c.firstName,
                        lastName: c.lastName,
                        phone: c.phone,
                        email: c.email,
                        address: c.address,
                      });
                      setOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button variant="danger-ghost" size="sm" onClick={() => remove.mutate(c.id)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.data?.data.length === 0 ? <p className="px-4 py-8 text-sm text-ink-muted">No customers match.</p> : null}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>{editing ? "Edit customer" : "Add customer"}</DialogTitle>
          <DialogDescription>All fields are required.</DialogDescription>
          <form
            className="mt-4 grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="First name" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} />
              <Field label="Last name" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} />
            </div>
            <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <Field label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
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

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} required />
    </div>
  );
}
