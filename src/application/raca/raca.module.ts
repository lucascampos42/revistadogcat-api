import { Module } from '@nestjs/common';
import { RacaService } from './raca.service';
import { RacaController } from './raca.controller';
import { RacaRepository } from './raca.repository';
import { PrismaModule } from '../../core/config/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RacaController],
  providers: [RacaService, RacaRepository],
})
export class RacaModule {}
