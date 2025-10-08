import { Module } from '@nestjs/common';
import { EdicaoController } from './edicao.controller';
import { EdicaoService } from './edicao.service';
import { EdicaoRepository } from './repositories/edicao.repository';
import { PrismaModule } from '../../core/config/prisma.module';
import { FileUploadModule } from '../../core/services/file-upload.module';

@Module({
  imports: [PrismaModule, FileUploadModule],
  controllers: [EdicaoController],
  providers: [EdicaoService, EdicaoRepository],
  exports: [EdicaoService, EdicaoRepository],
})
export class EdicaoModule {}
