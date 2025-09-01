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

    // Log do erro completo no console, independentemente do tipo.
    // Isso garante que o desenvolvedor SEMPRE veja o erro original.
    this.logger.error(
      `Erro capturado na rota: ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : JSON.stringify(exception),
    );

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal Server Error';
    let error = 'Error';

    if (exception instanceof HttpException) {
      // Se for uma exceção HTTP conhecida, usamos os dados dela.
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      error = exception.constructor.name;

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else {
        // Captura a mensagem e o erro de DTOs de validação, etc.
        message = (exceptionResponse as any).message || exception.message;
        error = (exceptionResponse as any).error || error;
      }
    } else if (exception instanceof Error) {
      // Se for um erro genérico do JavaScript, usamos sua mensagem.
      message = exception.message;
      error = exception.name;
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
