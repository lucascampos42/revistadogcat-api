import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response, Request } from 'express';

interface StandardResponse<T> {
  statusCode: number;
  message: string;
  data?: T;
  timestamp: string;
}

@Injectable()
export class ResponseFormatInterceptor<T>
  implements NestInterceptor<T, StandardResponse<T>>
{
  private getStandardMessage(statusCode: number): string {
    const statusMessages = {
      200: 'O raro momento em que tudo funciona',
      201: 'Criado. E você jurando que não ia dar certo',
      204: 'OK, mas sem resposta... tipo ghosting',
      301: 'Mudou de endereço, mas te avisa',
      302: 'Mudou temporariamente (vida de nômade)',
    };

    return statusMessages[statusCode] || 'Operação realizada com sucesso';
  }

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardResponse<T>> {
    const http = context.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<Request>();

    return next.handle().pipe(
      map((data) => {
        const statusCode = response.statusCode;
        if (data && typeof data === 'object' && 'statusCode' in data) {
          return data;
        }

        // Para status 204, não retornar data
        if (statusCode === 204) {
          return {
            statusCode,
            message: this.getStandardMessage(statusCode),
            timestamp: new Date().toISOString(),
          };
        }

        // Mensagens customizadas para listas vazias de artigos
        let message = this.getStandardMessage(statusCode);
        try {
          const path = request?.path || '';
          const isArtigosRoute = path.startsWith('/artigos');

          // Caso 1: endpoints que retornam objeto com { data: [] }
          if (
            isArtigosRoute &&
            data &&
            typeof data === 'object' &&
            Array.isArray(data.data) &&
            (data.data as any[]).length === 0
          ) {
            message = 'Nenhum artigo cadastrado';
          }

          // Caso 2: endpoints que retornam diretamente um array [] (ex.: destaques)
          if (isArtigosRoute && Array.isArray(data) && data.length === 0) {
            message = 'Nenhum artigo encontrado';
          }
        } catch {
          // Em caso de qualquer erro, mantém mensagem padrão
        }

        return {
          statusCode,
          message,
          data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
