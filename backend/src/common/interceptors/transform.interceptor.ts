import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface StandardResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta: any | null;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, StandardResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // If data is already in ResponseHelper format
        if (
          data &&
          typeof data === 'object' &&
          'success' in data &&
          'data' in data
        ) {
          return {
            success: data.success ?? true,
            message: data.message ?? 'Operation completed successfully',
            data: data.data,
            meta: data.meta ?? null,
          };
        }

        return {
          success: true,
          message: 'Operation completed successfully',
          data,
          meta: null,
        };
      }),
    );
  }
}
