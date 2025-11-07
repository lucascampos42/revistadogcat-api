import { Controller, Sse, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { Observable, map } from 'rxjs';
import { VotacaoRealtimeService } from './votacao-realtime.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

type SseMessageEvent = { data: unknown };

@ApiTags('Votação')
@Controller('votacao')
@UseGuards(JwtAuthGuard)
export class VotacaoStreamController {
  constructor(private readonly realtime: VotacaoRealtimeService) {}

  @Sse('stream')
  @ApiOperation({
    summary: 'Stream de votos em tempo real',
    description:
      'Endpoint SSE para acompanhar atualizações de votos em tempo real',
  })
  stream(): Observable<SseMessageEvent> {
    return this.realtime.stream$.pipe(map((data) => ({ data })));
  }
}