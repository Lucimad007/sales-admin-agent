import { z } from "zod";

export const loginBodySchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase().trim()),
  password: z.string().min(8).max(128),
});

export type LoginBody = z.infer<typeof loginBodySchema>;

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
});

export type User = z.infer<typeof userSchema>;
