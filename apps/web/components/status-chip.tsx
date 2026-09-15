import type { SaleStatus } from "@sales/shared";
import { Badge } from "@/components/ui/badge";
import { statusLabel } from "@/lib/format";

export function StatusChip({ status }: { status: SaleStatus }) {
  return <Badge variant={status}>{statusLabel(status)}</Badge>;
}
