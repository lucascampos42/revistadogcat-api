import { Module } from '@nestjs/common';
import { EnderecoController } from './endereco.controller';
import { EnderecoService } from './endereco.service';
import { EnderecoRepository } from './repositories/endereco.repository';
import { PrismaService } from '../../core/config/prisma.service';

@Module({
  controllers: [EnderecoController],
  providers: [EnderecoService, EnderecoRepository, PrismaService],
  exports: [EnderecoService],
})
export class EnderecoModule {}