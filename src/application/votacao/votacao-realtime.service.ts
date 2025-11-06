import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Subject } from 'rxjs';

export type VotoEvento = {
  cadastroId: string;
  totalVotos: number;
  tipo: 'COMUM' | 'SUPER';
  timestamp: string;
};

@Injectable()
export class VotacaoRealtimeService implements OnModuleDestroy {
  private readonly subject = new Subject<VotoEvento>();

  // Observable para os assinantes SSE
  get stream$() {
    return this.subject.asObservable();
  }

  // Emissão de evento após criar/remover voto
  emitirAtualizacao(payload: Omit<VotoEvento, 'timestamp'>) {
    this.subject.next({
      ...payload,
      timestamp: new Date().toISOString(),
    });
  }

  onModuleDestroy() {
    this.subject.complete();
  }
}