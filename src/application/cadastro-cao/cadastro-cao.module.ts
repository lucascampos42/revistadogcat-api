import { Module } from '@nestjs/common';
import { CadastroCaoService } from './cadastro-cao.service';
import { CadastroCaoController } from './cadastro-cao.controller';
import { CadastroCaoRepository } from './repositories/cadastro-cao.repository';
import { PrismaModule } from '../../core/config/prisma.module';
import { FileUploadModule } from '../../core/services/file-upload.module';

@Module({
  imports: [PrismaModule, FileUploadModule],
  controllers: [CadastroCaoController],
  providers: [CadastroCaoService, CadastroCaoRepository],
  exports: [CadastroCaoService, CadastroCaoRepository],
})
export class CadastroCaoModule {}