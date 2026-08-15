import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Response } from "express";
import type { RequestWithId } from "../types/request-with-id";

type ExceptionBody = {
  message?: string | string[];
  error?: string;
  code?: string;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<RequestWithId>();
    const response = http.getResponse<Response>();
    const isHttpException = exception instanceof HttpException;
    const statusCode = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = isHttpException ? exception.getResponse() : undefined;
    const details: ExceptionBody =
      typeof body === "object" && body !== null ? body : {};
    const isValidation =
      statusCode === Number(HttpStatus.BAD_REQUEST) &&
      Array.isArray(details.message);
    const message =
      statusCode === Number(HttpStatus.INTERNAL_SERVER_ERROR)
        ? "Internal server error"
        : (details.message ??
          (typeof body === "string"
            ? body
            : exception instanceof Error
              ? exception.message
              : "Request failed"));

    if (!isHttpException || statusCode >= 500) {
      this.logger.error(
        JSON.stringify({
          requestId: request.requestId,
          method: request.method,
          path: request.originalUrl,
          statusCode,
          error:
            exception instanceof Error ? exception.message : "Unknown error",
        }),
        process.env.NODE_ENV === "production"
          ? undefined
          : exception instanceof Error
            ? exception.stack
            : undefined,
      );
    }

    response.status(statusCode).json({
      statusCode,
      code:
        details.code ??
        (isValidation
          ? "VALIDATION_ERROR"
          : statusCode >= 500
            ? "INTERNAL_ERROR"
            : (details.error?.toUpperCase().replace(/\s+/g, "_") ??
              "HTTP_ERROR")),
      message,
      path: request.originalUrl,
      requestId: request.requestId,
      timestamp: new Date().toISOString(),
    });
  }
}
