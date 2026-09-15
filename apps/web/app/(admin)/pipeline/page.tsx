"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { KANBAN_STATUSES, type KanbanStatus, type ListResponse, type Sale, type SaleStatus } from "@sales/shared";
import { StatusChip } from "@/components/status-chip";
import { Badge } from "@/components/ui/badge";
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
  const [stage, setStage] = useState<KanbanStatus>("new");
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

  const moveTo = (sale: Sale, status: SaleStatus) => {
    if (sale.status === status) return;
    move.mutate({ id: sale.id, status });
  };

  return (
    <div>
      <h1 className="text-2xl font-medium tracking-tight">Pipeline</h1>
      <p className="mt-1 text-sm text-ink-muted lg:hidden">Pick a stage, then move a deal with the menu on the card.</p>
      <p className="mt-1 hidden text-sm text-ink-muted lg:block">Cancelled deals stay on the sales list, not this board. Drag cards between columns.</p>

      <div className="lg:hidden">
        <div
          className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-10 -mx-4 mt-4 border-b border-line bg-canvas/90 px-4 py-3 backdrop-blur-md"
          role="tablist"
          aria-label="Pipeline stage"
        >
          <div className="grid grid-cols-3 gap-1 rounded-[12px] border border-line bg-panel p-1 shadow-paper">
            {KANBAN_STATUSES.map((status) => {
              const active = stage === status;
              return (
                <button
                  key={status}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setStage(status)}
                  className={cn(
                    "flex min-h-11 flex-col items-center justify-center rounded-lg px-1 py-1.5 transition-[color,background-color,box-shadow] duration-200 ease-ledger",
                    active ? "bg-canvas shadow-paper" : "text-ink-muted",
                  )}
                >
                  <span className={cn("text-[11px] font-medium leading-tight", active && titleTones[status])}>
                    {statusLabel(status)}
                  </span>
                  <span className="font-mono text-[10px] tabular-nums">{columns[status].length}</span>
                </button>
              );
            })}
          </div>
        </div>
        <ul className="mt-4 space-y-2">
          {columns[stage].map((sale) => (
            <li key={sale.id}>
              <MobileDealCard sale={sale} onMove={(status) => moveTo(sale, status)} />
            </li>
          ))}
          {columns[stage].length === 0 ? (
            <li className="rounded-[12px] border border-line bg-panel px-4 py-10 text-center text-sm text-ink-muted">
              No deals in {statusLabel(stage).toLowerCase()}.
            </li>
          ) : null}
        </ul>
      </div>

      <Kanban
        className="mt-6 hidden min-w-0 lg:block"
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
        <KanbanBoard className="grid-cols-3">
          {KANBAN_STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              value={status}
              className={cn(
                "min-w-0 rounded-[12px] border border-line border-t-[3px] bg-panel p-3 shadow-lift",
                accents[status],
              )}
            >
              <div className="mb-3 flex items-center justify-between gap-2 px-1">
                <h2 className={cn("text-sm font-medium", titleTones[status])}>{statusLabel(status)}</h2>
                <Badge variant={status}>{columns[status].length}</Badge>
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

function MobileDealCard({ sale, onMove }: { sale: Sale; onMove: (status: SaleStatus) => void }) {
  return (
    <Card className="p-3 shadow-paper">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="copper">Deal</Badge>
        <StatusChip status={sale.status} />
      </div>
      <p className="mt-2 break-words text-sm font-medium">{sale.productName}</p>
      <p className="mt-1 text-xs text-ink-muted">
        {sale.customer ? `${sale.customer.firstName} ${sale.customer.lastName}` : "—"}
      </p>
      <p className="mt-2 font-mono text-sm text-copper">{formatMoney(sale.price)}</p>
      <label className="mt-3 block">
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">Move to</span>
        <select
          className="ledger-select mt-1.5 w-full"
          value={sale.status}
          onChange={(e) => onMove(e.target.value as SaleStatus)}
        >
          {KANBAN_STATUSES.map((status) => (
            <option key={status} value={status}>
              {statusLabel(status)}
            </option>
          ))}
        </select>
      </label>
    </Card>
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
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="copper">Deal</Badge>
        <StatusChip status={sale.status} />
      </div>
      <p className="mt-2 break-words text-sm">{sale.productName}</p>
      <p className="mt-1 text-xs text-ink-muted">
        {sale.customer ? `${sale.customer.firstName} ${sale.customer.lastName}` : "—"}
      </p>
      <p className="mt-2 font-mono text-sm text-copper">{formatMoney(sale.price)}</p>
    </Card>
  );
}
