import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

const HTTP_STATUS_CODES: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'VALIDATION_ERROR',
  500: 'INTERNAL_SERVER_ERROR',
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_SERVER_ERROR';
    let details: any[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      code = HTTP_STATUS_CODES[status] || `HTTP_${status}`;

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const errObj = res as Record<string, any>;

        // If custom structure already passed: { success, message, error: { code, details } }
        if (errObj.error && typeof errObj.error === 'object') {
          if (errObj.message) message = errObj.message;
          if (errObj.error.code) code = errObj.error.code;
          if (errObj.error.details) details = errObj.error.details;
        } else {
          // NestJS default ValidationPipe format
          if (Array.isArray(errObj.message)) {
            code = status === 422 ? 'VALIDATION_ERROR' : 'VALIDATION_ERROR';
            message = 'Validation failed';
            details = errObj.message;
          } else {
            message = errObj.message || exception.message || 'Request failed';
            if (errObj.error && typeof errObj.error === 'string') {
              code = errObj.error.toUpperCase().replace(/\s+/g, '_');
            }
          }
        }
      }
    } else if (exception instanceof Error) {
      console.error('Unhandled Server Exception:', exception);
      message = exception.message || 'Internal server error';
    }

    response.status(status).json({
      success: false,
      message,
      error: {
        code,
        details: Array.isArray(details) ? details : [details],
      },
    });
  }
}
