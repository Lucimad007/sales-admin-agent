import { z } from "zod";
import type { PaginationMeta } from "./pagination";

export type { PaginationMeta, PaginationQuery } from "./pagination";
export { paginationQuerySchema } from "./pagination";

export type ListMeta = PaginationMeta;

export type ListResponse<T> = {
  data: T[];
  meta: ListMeta;
};

export type DataResponse<T> = {
  data: T;
};

export const errorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().nullable().optional(),
  }),
});

export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>;
