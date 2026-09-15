import { z } from "zod";

export const errorCodes = [
  "VALIDATION_ERROR",
  "UNAUTHORIZED",
  "NOT_FOUND",
  "CONFLICT",
  "INTERNAL",
] as const;

export const errorCodeSchema = z.enum(errorCodes);
export type ErrorCode = z.infer<typeof errorCodeSchema>;

export const apiErrorSchema = z.object({
  error: z.object({
    code: errorCodeSchema,
    message: z.string(),
    details: z.unknown().nullable(),
  }),
});

export type ApiErrorBody = z.infer<typeof apiErrorSchema>;
