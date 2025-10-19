import { Module } from '@nestjs/common';
import { ArtigoService } from './artigo.service';
import { ArtigoController } from './artigo.controller';
import { ArtigoRepository } from './repositories/artigo.repository';
import { ComentarioRepository } from './repositories/comentario.repository'; // Import the new repository
import { PrismaModule } from '../../core/config/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ArtigoController],
  providers: [ArtigoService, ArtigoRepository, ComentarioRepository], // Add it to the providers array
  exports: [ArtigoService, ArtigoRepository, ComentarioRepository], // Also export it
})
export class ArtigoModule {}
