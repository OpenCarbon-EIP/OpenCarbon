import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} failed with status ${status}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      const msg =
        exception instanceof HttpException ? exception.message : 'Error';
      this.logger.warn(
        `${request.method} ${request.url} failed with status ${status}: ${msg}`,
      );
    }

    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null) {
        return response.status(status).json(res);
      }
      return response.status(status).json({
        statusCode: status,
        message: exception.message,
      });
    }

    response.status(status).json({
      statusCode: status,
      message: 'Internal server error',
    });
  }
}
