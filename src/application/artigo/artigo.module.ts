import { Module } from '@nestjs/common';
import { ArtigoService } from './artigo.service';
import { ArtigoController } from './artigo.controller';
import { ArtigoRepository } from './repositories/artigo.repository';
import { ComentarioRepository } from './repositories/comentario.repository';
import { ArtigoViewRepository } from './repositories/artigo-view.repository';
import { ArtigoCurtidaRepository } from './repositories/artigo-curtida.repository';
import { PrismaModule } from '../../core/config/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ArtigoController],
  providers: [
    ArtigoService,
    ArtigoRepository,
    ComentarioRepository,
    ArtigoViewRepository,
    ArtigoCurtidaRepository,
  ],
  exports: [
    ArtigoService,
    ArtigoRepository,
    ComentarioRepository,
    ArtigoViewRepository,
    ArtigoCurtidaRepository,
  ],
})
export class ArtigoModule {}
