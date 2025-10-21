import { Module } from '@nestjs/common';
import { VotacaoController } from './votacao.controller';
import { AdminVotosController } from './admin-votos.controller';
import { KardexController } from './kardex.controller';
import { VotacaoService } from './votacao.service';
import { KardexService } from './kardex.service';
import { ExportacaoService } from './exportacao.service';
import { RelatorioService } from './relatorio.service';
import { PrismaModule } from '../../core/config/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VotacaoController, AdminVotosController, KardexController],
  providers: [
    VotacaoService,
    KardexService,
    ExportacaoService,
    RelatorioService,
  ],
  exports: [VotacaoService, KardexService, ExportacaoService, RelatorioService],
})
export class VotacaoModule {}
