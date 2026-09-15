"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { KANBAN_STATUSES, type KanbanStatus, type ListResponse, type Sale, type SaleStatus } from "@sales/shared";
import { Card } from "@/components/ui/card";
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnContent,
  KanbanItem,
  KanbanItemHandle,
  KanbanOverlay,
} from "@/components/ui/kanban";
import { api, apiData, ApiError } from "@/lib/api";
import { formatMoney, statusLabel } from "@/lib/format";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

const accents: Record<KanbanStatus, string> = {
  new: "border-t-new",
  in_progress: "border-t-progress",
  completed: "border-t-done",
};

const titleTones: Record<KanbanStatus, string> = {
  new: "text-new",
  in_progress: "text-progress",
  completed: "text-success",
};

function emptyBoard(): Record<KanbanStatus, Sale[]> {
  return { new: [], in_progress: [], completed: [] };
}

function toColumns(sales: Sale[]): Record<KanbanStatus, Sale[]> {
  const next = emptyBoard();
  for (const sale of sales) {
    if (sale.status === "cancelled") continue;
    next[sale.status].push(sale);
  }
  return next;
}

export default function PipelinePage() {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: qk.sales({ board: true }),
    queryFn: () => api<ListResponse<Sale>>("/api/sales?pageSize=100"),
  });

  const fromServer = useMemo(() => toColumns(list.data?.data ?? []), [list.data?.data]);
  const [columns, setColumns] = useState<Record<KanbanStatus, Sale[]>>(fromServer);

  useEffect(() => {
    setColumns(fromServer);
  }, [fromServer]);

  const saleById = useMemo(() => {
    const map = new Map<string, Sale>();
    for (const sale of list.data?.data ?? []) map.set(sale.id, sale);
    return map;
  }, [list.data?.data]);

  const move = useMutation({
    mutationFn: ({ id, status }: { id: string; status: SaleStatus }) =>
      apiData(`/api/sales/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: qk.sales({ board: true }) });
      const previous = qc.getQueryData<ListResponse<Sale>>(qk.sales({ board: true }));
      qc.setQueryData<ListResponse<Sale>>(qk.sales({ board: true }), (curr) => {
        if (!curr) return curr;
        return {
          ...curr,
          data: curr.data.map((s) => (s.id === id ? { ...s, status } : s)),
        };
      });
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(qk.sales({ board: true }), ctx.previous);
      toast.error(err instanceof ApiError ? err.message : "Could not move sale");
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["sales"] });
      void qc.invalidateQueries({ queryKey: qk.dashboard });
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-medium tracking-tight">Pipeline</h1>
      <p className="mt-1 text-sm text-ink-muted">Cancelled deals stay on the sales list, not this board.</p>
      <Kanban
        className="mt-6"
        value={columns}
        onValueChange={(next) => setColumns(next as Record<KanbanStatus, Sale[]>)}
        getItemValue={(item) => item.id}
        onMove={({ event, activeContainer, overContainer }) => {
          const saleId = String(event.active.id);
          if (activeContainer === overContainer) return;
          if (!KANBAN_STATUSES.includes(overContainer as KanbanStatus)) return;
          const current = saleById.get(saleId);
          if (!current || current.status === overContainer) return;
          move.mutate({ id: saleId, status: overContainer as SaleStatus });
        }}
      >
        <KanbanBoard className="grid-cols-1 lg:grid-cols-3">
          {KANBAN_STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              value={status}
              className={cn(
                "rounded-[12px] border border-line border-t-[3px] bg-panel p-3 shadow-lift",
                accents[status],
              )}
            >
              <div className="mb-3 flex items-baseline justify-between px-1">
                <h2 className={cn("text-sm font-medium", titleTones[status])}>{statusLabel(status)}</h2>
                <span className="font-mono text-xs text-ink-muted">{columns[status].length}</span>
              </div>
              <KanbanColumnContent value={status} className="min-h-[240px] gap-2">
                {columns[status].map((sale) => (
                  <SaleCard key={sale.id} sale={sale} />
                ))}
              </KanbanColumnContent>
            </KanbanColumn>
          ))}
        </KanbanBoard>
        <KanbanOverlay>
          {({ value, variant }) => {
            if (variant !== "item") return null;
            const sale = saleById.get(String(value));
            if (!sale) {
              return <div className="size-full rounded-[10px] bg-panel/50" />;
            }
            return (
              <SaleBody
                sale={sale}
                className="cursor-grabbing border-line bg-panel/80 opacity-90 shadow-float"
              />
            );
          }}
        </KanbanOverlay>
      </Kanban>
    </div>
  );
}

function SaleCard({ sale }: { sale: Sale }) {
  return (
    <KanbanItem value={sale.id}>
      <KanbanItemHandle>
        <SaleBody sale={sale} />
      </KanbanItemHandle>
    </KanbanItem>
  );
}

function SaleBody({ sale, className }: { sale: Sale; className?: string }) {
  return (
    <Card className={cn("cursor-grab p-3 shadow-paper transition-[box-shadow,transform] duration-200 ease-ledger hover:-translate-y-0.5 hover:shadow-float active:cursor-grabbing", className)}>
      <p className="text-sm">{sale.productName}</p>
      <p className="mt-1 text-xs text-ink-muted">
        {sale.customer ? `${sale.customer.firstName} ${sale.customer.lastName}` : "—"}
      </p>
      <p className="mt-2 font-mono text-sm text-copper">{formatMoney(sale.price)}</p>
    </Card>
  );
}
