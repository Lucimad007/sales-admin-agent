"use client";

import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { KANBAN_STATUSES, type KanbanStatus, type ListResponse, type Sale, type SaleStatus } from "@sales/shared";
import { Card } from "@/components/ui/card";
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

export default function PipelinePage() {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: qk.sales({ board: true }),
    queryFn: () => api<ListResponse<Sale>>("/api/sales?pageSize=100"),
  });

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

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const board = (list.data?.data ?? []).filter((s) => s.status !== "cancelled");

  const onDragEnd = (event: DragEndEvent) => {
    const saleId = String(event.active.id);
    const overId = event.over?.id ? String(event.over.id) : null;
    if (!overId) return;
    const overSale = board.find((s) => s.id === overId);
    const column = KANBAN_STATUSES.includes(overId as KanbanStatus)
      ? (overId as KanbanStatus)
      : (overSale?.status as KanbanStatus | undefined);
    if (!column) return;
    const current = board.find((s) => s.id === saleId);
    if (!current || current.status === column) return;
    move.mutate({ id: saleId, status: column });
  };

  return (
    <div>
      <h1 className="text-2xl font-medium tracking-tight">Pipeline</h1>
      <p className="mt-1 text-sm text-ink-muted">Cancelled deals stay on the sales list, not this board.</p>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {KANBAN_STATUSES.map((status) => {
            const items = board.filter((s) => s.status === status);
            return (
              <Column key={status} status={status} items={items} />
            );
          })}
        </div>
      </DndContext>
    </div>
  );
}

function Column({ status, items }: { status: KanbanStatus; items: Sale[] }) {
  const { setNodeRef } = useDroppable({ id: status });
  return (
    <section className={cn("rounded-[10px] border border-line border-t-[3px] bg-panel p-3 shadow-paper", accents[status])}>
      <div className="mb-3 flex items-baseline justify-between px-1">
        <h2 className={cn("text-sm font-medium", titleTones[status])}>{statusLabel(status)}</h2>
        <span className="font-mono text-xs text-ink-muted">{items.length}</span>
      </div>
      <SortableContext items={items.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="min-h-[240px] space-y-2">
          {items.map((sale) => (
            <SaleCard key={sale.id} sale={sale} />
          ))}
        </div>
      </SortableContext>
    </section>
  );
}

function SaleCard({ sale }: { sale: Sale }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sale.id });
  return (
    <Card
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("cursor-grab p-3 active:cursor-grabbing", isDragging && "opacity-70")}
      {...attributes}
      {...listeners}
    >
      <p className="text-sm">{sale.productName}</p>
      <p className="mt-1 text-xs text-ink-muted">
        {sale.customer ? `${sale.customer.firstName} ${sale.customer.lastName}` : "—"}
      </p>
      <p className="mt-2 font-mono text-sm text-copper">{formatMoney(sale.price)}</p>
    </Card>
  );
}
