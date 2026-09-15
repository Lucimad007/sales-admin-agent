"use client";

import type { GenUiPart, SaleStatus } from "@sales/shared";
import Link from "next/link";
import { StatusChip } from "@/components/status-chip";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChatMarkdown } from "@/components/copilot/chat-markdown";
import { formatKpiValue, formatMoney } from "@/lib/format";

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
      <Card className="min-w-0 overflow-hidden p-0">
        {part.props.items.map((item, i) => (
          <div
            key={item.label}
            className={`flex items-baseline justify-between gap-3 px-3 py-2.5 ${i > 0 ? "border-t border-line" : ""}`}
          >
            <p className="shrink-0 text-[11px] uppercase tracking-[0.12em] text-ink-muted">{item.label}</p>
            <p className="min-w-0 truncate text-right font-mono text-sm tabular-nums">
              {/revenue|price|amount/i.test(item.label) ? (
                <span className="text-copper">{formatKpiValue(item.label, item.value)}</span>
              ) : (
                formatKpiValue(item.label, item.value)
              )}
            </p>
          </div>
        ))}
      </Card>
    );
  }
  if (part.type === "CustomerCard") {
    const p = part.props;
    return (
      <Card className="min-w-0 overflow-hidden p-3">
        <Link href={`/customers/${p.id}`} className="font-medium hover:text-copper">
          {p.firstName} {p.lastName}
        </Link>
        <p className="mt-1 break-all font-mono text-[12px] text-ink-muted">{p.email}</p>
        <p className="text-sm text-ink-muted">{p.phone}</p>
        <p className="break-words text-sm text-ink-muted">{p.address}</p>
      </Card>
    );
  }
  if (part.type === "SalesTable") {
    return (
      <Card className="min-w-0 overflow-hidden p-0">
        <ul>
          {part.props.rows.map((row) => (
            <li
              key={row.id}
              className="flex items-center justify-between gap-3 border-b border-line px-3 py-2.5 last:border-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm">{row.productName}</p>
                <p className="truncate text-[12px] text-ink-muted">{row.customerName}</p>
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
    return (
      <div className="grid min-w-0 gap-2">
        {part.props.columns.map((col) => (
          <Card key={col.status} className="flex min-w-0 items-center justify-between gap-3 p-3">
            <StatusChip status={col.status} />
            <span className="shrink-0 font-mono text-[12px] tabular-nums text-copper">
              {col.count} · {formatMoney(col.total)}
            </span>
          </Card>
        ))}
      </div>
    );
  }
  if (part.type === "ConfirmAction") {
    return (
      <Card className="min-w-0 border-warn/50 p-3">
        <p className="text-sm font-medium">{part.props.title}</p>
        <p className="mt-1 break-words text-sm text-ink-muted">{part.props.summary}</p>
        <div className="mt-3 flex gap-2">
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
  return <ChatMarkdown text={part.props.markdown} />;
}
