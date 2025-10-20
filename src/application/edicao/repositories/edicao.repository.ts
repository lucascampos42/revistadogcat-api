import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/config/prisma.service';

export interface CreateEdicaoData {
  edicaoId: string;
  titulo: string;
  descricao: string;
  data: Date;
  pdfUrl: string;
  capaUrl?: string;
}

@Injectable()
export class EdicaoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateEdicaoData) {
    const edicao = await this.prisma.edicao.create({
      data,
    });
    return edicao;
  }

  async findAll(params: { ano?: number; page?: number; limit?: number }) {
    const { ano } = params;
    const page = Math.max(1, Number(params.page || 1));
    const limit = Math.min(Math.max(1, Number(params.limit || 12)), 50);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (typeof ano === 'number') {
      // Filtrar por ano usando a data
      where.data = {
        gte: new Date(`${ano}-01-01`),
        lt: new Date(`${ano + 1}-01-01`),
      };
    }

    const edicoes = await this.prisma.edicao.findMany({
      where,
      orderBy: [{ data: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    });

    return edicoes;
  }

  async findById(id: string) {
    return this.prisma.edicao.findUnique({ where: { edicaoId: id } });
  }

  async findUltima() {
    return this.prisma.edicao.findFirst({
      orderBy: [{ data: 'desc' }, { createdAt: 'desc' }],
    });
  }
}
