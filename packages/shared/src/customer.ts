import { z } from "zod";
import { paginationQuerySchema } from "./http";

export const customerSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string(),
  email: z.string().email(),
  address: z.string(),
  createdBy: z.string().uuid(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Customer = z.infer<typeof customerSchema>;

export const customerWriteSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  phone: z.string().trim().min(5).max(40),
  email: z.string().email().transform((v) => v.toLowerCase().trim()),
  address: z.string().trim().min(3).max(240),
});

export type CustomerWrite = z.infer<typeof customerWriteSchema>;

export const customerPatchSchema = customerWriteSchema.partial();
export type CustomerPatch = z.infer<typeof customerPatchSchema>;

export const customerListQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().optional().default(""),
});

export type CustomerListQuery = z.infer<typeof customerListQuerySchema>;
