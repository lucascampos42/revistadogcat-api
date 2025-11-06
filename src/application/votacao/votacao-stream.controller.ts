import { Controller, Sse, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { Observable, map } from 'rxjs';
import { VotacaoRealtimeService } from './votacao-realtime.service';

type SseMessageEvent = { data: unknown };

@Controller('votacao')
@UseGuards(JwtAuthGuard)
export class VotacaoStreamController {
  constructor(private readonly realtime: VotacaoRealtimeService) {}

  // Endpoint SSE para acompanhar atualizações de votos em tempo real
  @Sse('stream')
  stream(): Observable<SseMessageEvent> {
    return this.realtime.stream$.pipe(map((data) => ({ data })));
  }
}