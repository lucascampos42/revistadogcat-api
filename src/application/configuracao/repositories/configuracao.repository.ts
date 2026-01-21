import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/config/prisma.service';
import { ConfiguracaoEntity } from '../entities/configuracao.entity';

@Injectable()
export class ConfiguracaoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByChave(chave: string): Promise<ConfiguracaoEntity | null> {
    return this.prisma.configuracao.findUnique({
      where: { chave },
    });
  }

  async upsert(
    chave: string,
    valor: string,
    descricao?: string,
  ): Promise<ConfiguracaoEntity> {
    return this.prisma.configuracao.upsert({
      where: { chave },
      update: { valor, descricao },
      create: { chave, valor, descricao },
    });
  }

  async findAll(): Promise<ConfiguracaoEntity[]> {
    return this.prisma.configuracao.findMany({
      orderBy: { chave: 'asc' },
    });
  }
}
