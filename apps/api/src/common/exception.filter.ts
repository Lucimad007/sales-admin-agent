import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  Logger,
} from "@nestjs/common";
import type { Response } from "express";
import { ZodError } from "zod";
import { DomainError } from "./domain-error";

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  private readonly log = new Logger(AppExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    if (exception instanceof DomainError) {
      res.status(exception.status).json({
        error: { code: exception.code, message: exception.message, details: exception.details },
      });
      return;
    }

    if (exception instanceof ZodError) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: exception.flatten(),
        },
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const message = typeof body === "string" ? body : exception.message;
      res.status(status).json({
        error: {
          code: status === 401 ? "UNAUTHORIZED" : "INTERNAL",
          message,
          details: null,
        },
      });
      return;
    }

    this.log.error(exception);
    res.status(500).json({
      error: { code: "INTERNAL", message: "Unexpected server error", details: null },
    });
  }
}
