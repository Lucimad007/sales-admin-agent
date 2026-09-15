import { type PipeTransform, Injectable } from "@nestjs/common";
import type { ZodType } from "zod";
import { validationError } from "./domain-error";

@Injectable()
export class ZodPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value ?? {});
    if (!result.success) {
      throw validationError("Request validation failed", result.error.flatten());
    }
    return result.data;
  }
}
