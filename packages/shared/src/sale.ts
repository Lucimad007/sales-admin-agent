import { z } from "zod";
import { paginationQuerySchema } from "./http";
import { saleStatusSchema } from "./sale-status";

export const moneySchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "Price must be a decimal with up to 2 places");

export const saleCustomerSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
});

export const saleSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  productName: z.string(),
  price: moneySchema,
  status: saleStatusSchema,
  notes: z.string(),
  createdBy: z.string().uuid(),
  createdAt: z.string(),
  updatedAt: z.string(),
  customer: saleCustomerSchema.optional(),
});

export type Sale = z.infer<typeof saleSchema>;

export const saleCreateSchema = z.object({
  customerId: z.string().uuid(),
  productName: z.string().trim().min(1).max(160),
  price: moneySchema,
  status: saleStatusSchema.optional().default("new"),
  notes: z.string().max(4000).optional().default(""),
});

export type SaleCreate = z.infer<typeof saleCreateSchema>;

export const salePatchSchema = z.object({
  customerId: z.string().uuid().optional(),
  productName: z.string().trim().min(1).max(160).optional(),
  price: moneySchema.optional(),
  status: saleStatusSchema.optional(),
  notes: z.string().max(4000).optional(),
});

export type SalePatch = z.infer<typeof salePatchSchema>;

export const saleStatusBodySchema = z.object({
  status: saleStatusSchema,
});

export const saleListQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().optional().default(""),
  status: saleStatusSchema.optional(),
  customerId: z.string().uuid().optional(),
});

export type SaleListQuery = z.infer<typeof saleListQuerySchema>;
