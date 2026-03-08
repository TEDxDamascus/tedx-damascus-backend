import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import {
  ApiResponse,
  PaginatedData,
} from '../interfaces/api-response.interface';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<{ method: string }>();
    const response = httpContext.getResponse<{ statusCode: number }>();

    return next.handle().pipe(
      map((data) => {
        if (
          data &&
          typeof data === 'object' &&
          'success' in (data as Record<string, unknown>) &&
          'data' in (data as Record<string, unknown>)
        ) {
          return data as unknown as ApiResponse<T>;
        }

        const { message, normalizedData } = this.extractMessageAndData(
          data,
          request.method,
        );

        return {
          success: true,
          statusCode: response.statusCode,
          message,
          data: normalizedData,
        };
      }),
    );
  }

  private extractMessageAndData(
    payload: unknown,
    method: string,
  ): { message: string; normalizedData: T } {
    if (!payload || typeof payload !== 'object') {
      return {
        message: this.getDefaultMessage(method),
        normalizedData: payload as T,
      };
    }

    const candidate = payload as Record<string, unknown>;
    const message =
      typeof candidate.message === 'string'
        ? candidate.message
        : this.getDefaultMessage(method);

    if ('data' in candidate) {
      return { message, normalizedData: candidate.data as T };
    }

    if (this.isPaginatedPayload(candidate)) {
      return {
        message,
        normalizedData: this.toPaginatedData(candidate) as T,
      };
    }

    return { message, normalizedData: payload as T };
  }

  private isPaginatedPayload(candidate: Record<string, unknown>): boolean {
    return (
      (Array.isArray(candidate.items) || Array.isArray(candidate.docs)) &&
      ('total' in candidate || 'totalDocs' in candidate) &&
      ('page' in candidate || 'currentPage' in candidate) &&
      'limit' in candidate
    );
  }

  private toPaginatedData(
    candidate: Record<string, unknown>,
  ): PaginatedData<unknown> {
    const items = (candidate.items ?? candidate.docs ?? []) as unknown[];
    const total = Number(candidate.total ?? candidate.totalDocs ?? 0);
    const page = Number(candidate.page ?? candidate.currentPage ?? 1);
    const limit = Number(candidate.limit ?? 10);
    const totalPages = Number(
      candidate.totalPages ?? Math.ceil(total / Math.max(limit, 1)),
    );
    const hasNextPage = Boolean(candidate.hasNextPage ?? page < totalPages);
    const hasPreviousPage = Boolean(
      candidate.hasPreviousPage ?? candidate.hasPrevPage ?? page > 1,
    );

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    };
  }

  private getDefaultMessage(method: string): string {
    switch (method) {
      case 'POST':
        return 'Created successfully';
      case 'PUT':
      case 'PATCH':
        return 'Updated successfully';
      case 'DELETE':
        return 'Deleted successfully';
      default:
        return 'Request successful';
    }
  }
}
