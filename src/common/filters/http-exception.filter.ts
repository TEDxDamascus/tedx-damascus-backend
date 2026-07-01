import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiErrorResponse } from '../interfaces/api-response.interface';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const statusCode = this.getStatusCode(exception);
    this.logException(exception, statusCode, request);

    const payload = this.buildErrorPayload(exception, statusCode);

    response.status(statusCode).json(payload);
  }

  private logException(
    exception: unknown,
    statusCode: number,
    request: Request,
  ): void {
    const context = `${request.method} ${request.url}`;

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      const detail =
        typeof response === 'string'
          ? response
          : JSON.stringify(response);

      if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
        this.logger.error(
          `[${statusCode}] ${context} ${exception.message} — ${detail}`,
          exception.stack,
        );
      } else {
        this.logger.warn(
          `[${statusCode}] ${context} ${exception.message} — ${detail}`,
        );
      }
      return;
    }

    if (exception instanceof Error) {
      this.logger.error(
        `[${statusCode}] ${context} ${exception.name}: ${exception.message}`,
        exception.stack,
      );
      return;
    }

    this.logger.error(
      `[${statusCode}] ${context} ${String(exception)}`,
    );
  }

  private getStatusCode(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private buildErrorPayload(
    exception: unknown,
    statusCode: number,
  ): ApiErrorResponse {
    if (!(exception instanceof HttpException)) {
      const isDev = process.env.NODE_ENV !== 'production';
      return {
        success: false,
        statusCode,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
        details: isDev ? this.serializeUnknownError(exception) : null,
      };
    }

    const response = exception.getResponse();
    const normalized = this.normalizeExceptionResponse(response);

    if (statusCode === 422) {
      return {
        success: false,
        statusCode,
        message: 'Validation failed',
        error: 'VALIDATION_ERROR',
        details: this.normalizeValidationDetails(normalized.details),
      };
    }

    return {
      success: false,
      statusCode,
      message: normalized.message,
      error: normalized.errorCode,
      details: normalized.details,
    };
  }

  private normalizeExceptionResponse(response: unknown): {
    message: string;
    errorCode: string;
    details: unknown;
  } {
    if (typeof response === 'string') {
      return {
        message: response,
        errorCode: this.toErrorCode(response),
        details: null,
      };
    }

    if (response && typeof response === 'object') {
      const candidate = response as Record<string, unknown>;
      const message = this.getMessage(candidate.message);
      const errorSource =
        (candidate.error as string) ??
        (candidate.code as string) ??
        message ??
        'Request failed';
      return {
        message,
        errorCode: this.toErrorCode(errorSource),
        details: candidate.details ?? candidate.message ?? null,
      };
    }

    return {
      message: 'Request failed',
      errorCode: 'REQUEST_FAILED',
      details: null,
    };
  }

  private getMessage(message: unknown): string {
    if (Array.isArray(message)) {
      const firstString = message.find(
        (item): item is string => typeof item === 'string',
      );
      return firstString ?? 'Request failed';
    }
    if (typeof message === 'string') {
      return message;
    }
    return 'Request failed';
  }

  private normalizeValidationDetails(
    details: unknown,
  ): Array<{ field: string; message: string }> {
    if (!Array.isArray(details)) {
      return [];
    }

    return details.map((detail) => {
      if (typeof detail === 'string') {
        return this.fromValidationMessage(detail);
      }

      if (detail && typeof detail === 'object') {
        const candidate = detail as Record<string, unknown>;
        if (
          typeof candidate.field === 'string' &&
          typeof candidate.message === 'string'
        ) {
          return { field: candidate.field, message: candidate.message };
        }
      }

      return { field: 'unknown', message: String(detail) };
    });
  }

  private fromValidationMessage(message: string): {
    field: string;
    message: string;
  } {
    const firstSpaceIndex = message.indexOf(' ');
    if (firstSpaceIndex <= 0) {
      return { field: 'unknown', message };
    }
    return {
      field: message.slice(0, firstSpaceIndex),
      message,
    };
  }

  private toErrorCode(value: string): string {
    return (
      value
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '') || 'REQUEST_FAILED'
    );
  }

  private serializeUnknownError(exception: unknown): {
    name?: string;
    message: string;
  } {
    if (exception instanceof Error) {
      return {
        name: exception.name,
        message: exception.message,
      };
    }

    return { message: String(exception) };
  }
}
