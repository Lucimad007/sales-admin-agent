import { z } from "zod";
import { saleStatusSchema } from "./sale-status";

export const dashboardRecentSaleSchema = z.object({
  id: z.string().uuid(),
  productName: z.string(),
  price: z.string(),
  status: saleStatusSchema,
  createdAt: z.string(),
  customerName: z.string(),
});

export const dashboardSchema = z.object({
  totalCustomers: z.number().int(),
  totalSales: z.number().int(),
  totalRevenue: z.string(),
  salesByStatus: z.object({
    new: z.number().int(),
    in_progress: z.number().int(),
    completed: z.number().int(),
    cancelled: z.number().int(),
  }),
  recentSales: z.array(dashboardRecentSaleSchema),
});

export type Dashboard = z.infer<typeof dashboardSchema>;
