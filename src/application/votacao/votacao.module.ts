import { Module } from '@nestjs/common';
import { VotacaoController } from './votacao.controller';
import { AdminVotosController } from './admin-votos.controller';
import { KardexController } from './kardex.controller';
import { VotacaoService } from './votacao.service';
import { KardexService } from './kardex.service';
import { ExportacaoService } from './exportacao.service';
import { RelatorioService } from './relatorio.service';
import { PrismaModule } from '../../core/config/prisma.module';
import { VotacaoRealtimeService } from './votacao-realtime.service';
import { VotacaoStreamController } from './votacao-stream.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    VotacaoController,
    AdminVotosController,
    KardexController,
    VotacaoStreamController,
  ],
  providers: [
    VotacaoService,
    KardexService,
    ExportacaoService,
    RelatorioService,
    VotacaoRealtimeService,
  ],
  exports: [
    VotacaoService,
    KardexService,
    ExportacaoService,
    RelatorioService,
    VotacaoRealtimeService,
  ],
})
export class VotacaoModule {}
