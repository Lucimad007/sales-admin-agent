import type { SaleStatus } from "@sales/shared";
import { cn } from "@/lib/utils";
import { statusLabel } from "@/lib/format";

const tones: Record<SaleStatus, string> = {
  new: "text-new bg-new/18 ring-1 ring-new/35",
  in_progress: "text-progress bg-progress/18 ring-1 ring-progress/35",
  completed: "text-done bg-done/18 ring-1 ring-done/35",
  cancelled: "text-cancelled bg-cancelled/18 ring-1 ring-cancelled/35",
};

export function StatusChip({ status }: { status: SaleStatus }) {
  return (
    <span className={cn("inline-flex whitespace-nowrap rounded-md px-2 py-0.5 font-mono text-[11px]", tones[status])}>
      {statusLabel(status)}
    </span>
  );
}
