import { Module } from '@nestjs/common';
import { ConfiguracaoController } from './configuracao.controller';
import { ConfiguracaoService } from './configuracao.service';
import { ConfiguracaoRepository } from './repositories/configuracao.repository';
import { PrismaModule } from '../../core/config/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ConfiguracaoController],
  providers: [ConfiguracaoService, ConfiguracaoRepository],
  exports: [ConfiguracaoService],
})
export class ConfiguracaoModule {}
