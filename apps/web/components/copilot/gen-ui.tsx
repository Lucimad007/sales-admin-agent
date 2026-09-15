"use client";

import type { ReactNode } from "react";
import type { GenUiPart, SaleStatus } from "@sales/shared";
import Link from "next/link";
import { StatusChip } from "@/components/status-chip";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChatMarkdown } from "@/components/copilot/chat-markdown";
import { formatDate, formatKpiValue, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

function initials(first: string, last: string) {
  return `${first.slice(0, 1)}${last.slice(0, 1)}`.toUpperCase() || "?";
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[72px_1fr] gap-2 px-3 py-2">
      <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">{label}</dt>
      <dd className="min-w-0 break-words text-sm leading-5">{children}</dd>
    </div>
  );
}

const STAGE_EDGE: Record<string, string> = {
  new: "border-l-new",
  in_progress: "border-l-progress",
  completed: "border-l-done",
  cancelled: "border-l-cancelled",
};

const STAGE_FILL: Record<string, string> = {
  new: "bg-new",
  in_progress: "bg-progress",
  completed: "bg-done",
  cancelled: "bg-cancelled",
};

export function GenUi({
  part,
  onApprove,
  onReject,
  busy,
}: {
  part: GenUiPart;
  onApprove?: () => void;
  onReject?: () => void;
  busy?: boolean;
}) {
  if (part.type === "KpiStrip") {
    return (
      <div className="grid min-w-0 grid-cols-3 gap-1.5">
        {part.props.items.map((item) => {
          const money = /revenue|price|amount/i.test(item.label);
          return (
            <Card
              key={item.label}
              className={cn("min-w-0 p-2.5", money && "border-t-[3px] border-t-copper")}
            >
              <p className="truncate font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">{item.label}</p>
              <p
                className={cn(
                  "mt-1.5 truncate font-sans text-[18px] leading-none tracking-tight tabular-nums",
                  money && "text-copper",
                )}
              >
                {formatKpiValue(item.label, item.value)}
              </p>
            </Card>
          );
        })}
      </div>
    );
  }
  if (part.type === "CustomerCard") {
    const p = part.props;
    return (
      <Card className="min-w-0 overflow-hidden p-0">
        <div className="flex items-start gap-3 p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-copper/12 font-mono text-[13px] text-copper ring-1 ring-copper/30">
            {initials(p.firstName, p.lastName)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/customers/${p.id}`} className="font-medium hover:text-copper">
                {p.firstName} {p.lastName}
              </Link>
              <Badge variant="copper">Customer</Badge>
            </div>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">Ledger record</p>
          </div>
        </div>
        <dl className="border-t border-line">
          <Field label="Email">
            <span className="break-all font-mono text-[12px] text-ink-muted">{p.email}</span>
          </Field>
          <Field label="Phone">
            <span className="text-ink-muted">{p.phone}</span>
          </Field>
          <Field label="Address">
            <span className="text-ink-muted">{p.address}</span>
          </Field>
        </dl>
        <div className="border-t border-line px-3 py-2">
          <Link
            href={`/customers/${p.id}`}
            className="font-mono text-[11px] uppercase tracking-[0.12em] text-copper hover:text-copper-hover"
          >
            Open record →
          </Link>
        </div>
      </Card>
    );
  }
  if (part.type === "CustomerList") {
    return (
      <Card className="min-w-0 overflow-hidden p-0">
        <div className="border-b border-line px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
          Customers · {part.props.rows.length}
        </div>
        <ul>
          {part.props.rows.map((row) => (
            <li key={row.id} className="border-b border-line last:border-0">
              <Link
                href={`/customers/${row.id}`}
                className="flex items-center gap-3 px-3 py-2.5 transition-colors duration-150 ease-ledger hover:bg-canvas/70"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-canvas font-mono text-[11px] text-copper ring-1 ring-line">
                  {initials(row.firstName, row.lastName)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {row.firstName} {row.lastName}
                  </span>
                  <span className="mt-0.5 block truncate font-mono text-[11px] text-ink-muted">{row.email}</span>
                </span>
                <span className="shrink-0 font-mono text-[11px] text-copper">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    );
  }
  if (part.type === "SalesTable") {
    return (
      <Card className="min-w-0 overflow-hidden p-0">
        <div className="border-b border-line px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
          Sales · {part.props.rows.length}
        </div>
        <ul>
          {part.props.rows.map((row) => (
            <li
              key={row.id}
              className="flex items-start justify-between gap-3 border-b border-line px-3 py-2.5 last:border-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm">{row.productName}</p>
                <p className="truncate text-[12px] text-ink-muted">
                  {row.customerName}
                  {row.createdAt ? ` · ${formatDate(row.createdAt)}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="font-mono text-[12px] tabular-nums text-copper">{formatMoney(row.price)}</span>
                <StatusChip status={row.status as SaleStatus} />
              </div>
            </li>
          ))}
        </ul>
      </Card>
    );
  }
  if (part.type === "PipelineSummary") {
    const max = Math.max(1, ...part.props.columns.map((col) => col.count));
    return (
      <Card className="min-w-0 overflow-hidden p-0">
        <div className="border-b border-line px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
          Pipeline
        </div>
        <ul>
          {part.props.columns.map((col) => (
            <li
              key={col.status}
              className={cn("border-b border-line border-l-[3px] px-3 py-2.5 last:border-b-0", STAGE_EDGE[col.status])}
            >
              <div className="flex items-center justify-between gap-3">
                <StatusChip status={col.status} />
                <span className="shrink-0 font-mono text-[12px] tabular-nums text-copper">
                  {col.count} · {formatMoney(col.total)}
                </span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-canvas ring-1 ring-line/80">
                <div
                  className={cn("h-full rounded-full", STAGE_FILL[col.status])}
                  style={{ width: `${Math.round((col.count / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </Card>
    );
  }
  if (part.type === "ConfirmAction") {
    return (
      <Card className="min-w-0 overflow-hidden border-warn/50 p-0">
        <div className="flex items-center gap-2 border-b border-warn/30 bg-warn/8 px-3 py-2">
          <Badge variant="in_progress">Needs approval</Badge>
          <p className="text-sm font-medium">{part.props.title}</p>
        </div>
        <p className="break-words px-3 py-3 text-sm leading-6 text-ink-muted">{part.props.summary}</p>
        <div className="flex gap-2 border-t border-line px-3 py-2.5">
          <Button size="sm" variant="success" onClick={onApprove} disabled={busy}>
            Approve
          </Button>
          <Button size="sm" variant="danger-ghost" onClick={onReject} disabled={busy}>
            Reject
          </Button>
        </div>
      </Card>
    );
  }
  if (part.type === "Markdown") {
    return <ChatMarkdown text={part.props.markdown} />;
  }
  return null;
}
