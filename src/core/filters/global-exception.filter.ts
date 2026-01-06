import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Interface para a resposta de erro padronizada.
 */
interface ErrorResponse {
  statusCode: number;
  message: string | object;
  error: string;
  timestamp: string;
  path: string;
  stack?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal Server Error';
    let error = 'Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      error = exception.constructor.name;

      this.logger.error(
        `HttpException capturada: Status ${status} - Error: ${error}`,
      );
      if (typeof exceptionResponse === 'object') {
        this.logger.error(
          `Detalhes: ${JSON.stringify(exceptionResponse, null, 2)}`,
        );
      } else {
        this.logger.error(`Mensagem: ${exceptionResponse}`);
      }

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else {
        message = (exceptionResponse as any).message || exception.message;
        error = (exceptionResponse as any).error || error;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;

      this.logger.error(
        `Erro não tratado capturado: ${message}`,
        exception.stack,
      );
    }

    const errorResponse: ErrorResponse = {
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Em ambiente de desenvolvimento, inclui o stack trace na resposta JSON
    // para facilitar a depuração no cliente (Postman, Insomnia, etc.).
    if (process.env.NODE_ENV !== 'production' && exception instanceof Error) {
      errorResponse.stack = exception.stack;
    }

    response.status(status).json(errorResponse);
  }
}
