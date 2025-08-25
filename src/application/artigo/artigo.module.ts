import { Module } from '@nestjs/common';
import { ArtigoService } from './artigo.service';
import { ArtigoController } from './artigo.controller';
import { ArtigoRepository } from './repositories/artigo.repository';
import { PrismaModule } from '../../core/config/prisma.module';
import { FileUploadModule } from '../../core/services/file-upload.module';

@Module({
  imports: [PrismaModule, FileUploadModule],
  controllers: [ArtigoController],
  providers: [ArtigoService, ArtigoRepository],
  exports: [ArtigoService, ArtigoRepository],
})
export class ArtigoModule {}