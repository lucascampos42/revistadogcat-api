import { Module } from '@nestjs/common';
import { PagamentoController } from './pagamento.controller';
import { PagamentoService } from './pagamento.service';
import { PagamentoRepository } from './repositories/pagamento.repository';
import { PrismaModule } from '../../core/config/prisma.module';
import { CadastroCaoModule } from '../cadastro-cao/cadastro-cao.module';

@Module({
  imports: [PrismaModule, CadastroCaoModule],
  controllers: [PagamentoController],
  providers: [PagamentoService, PagamentoRepository],
  exports: [PagamentoService],
})
export class PagamentoModule {}
