import { z } from "zod";

export const SALE_STATUSES = ["new", "in_progress", "completed", "cancelled"] as const;
export const saleStatusSchema = z.enum(SALE_STATUSES);
export type SaleStatus = z.infer<typeof saleStatusSchema>;

export const KANBAN_STATUSES = ["new", "in_progress", "completed"] as const;
export type KanbanStatus = (typeof KANBAN_STATUSES)[number];

export const SALE_STATUS_LABELS: Record<SaleStatus, string> = {
  new: "New",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};
