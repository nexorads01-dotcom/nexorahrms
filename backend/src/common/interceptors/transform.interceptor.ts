import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: Record<string, unknown>;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest<{ path?: string; url?: string }>();
    const path = request.path ?? request.url?.split('?')[0] ?? '';
    // Do not wrap Swagger HTML/JSON — the UI would break if wrapped in { success, data }.
    if (path.startsWith('/api/docs')) {
      return next.handle() as Observable<ApiResponse<T>>;
    }

    return next.handle().pipe(
      map((data) => {
        if (data && typeof data === 'object' && 'meta' in data) {
          const { meta, ...rest } = data as Record<string, unknown>;
          return { success: true, data: rest as T, meta: meta as Record<string, unknown> };
        }
        return { success: true, data };
      }),
    );
  }
}
