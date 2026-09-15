import type { SaleStatus } from "@sales/shared";
import { cn } from "@/lib/utils";
import { statusLabel } from "@/lib/format";

const tones: Record<SaleStatus, string> = {
  new: "text-new bg-new/10",
  in_progress: "text-progress bg-progress/10",
  completed: "text-done bg-done/10",
  cancelled: "text-cancelled bg-cancelled/10",
};

export function StatusChip({ status }: { status: SaleStatus }) {
  return (
    <span className={cn("inline-flex whitespace-nowrap rounded-md px-2 py-0.5 font-mono text-[11px]", tones[status])}>
      {statusLabel(status)}
    </span>
  );
}
