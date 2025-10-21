import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/config/prisma.service';
import { AcaoKardex } from '@prisma/client';
import {
  ListKardexDto,
  KardexListResponseDto,
  KardexVotoDto,
} from '../../core/dto';

@Injectable()
export class KardexService {
  constructor(private readonly prisma: PrismaService) {}

  async listarKardex(params: ListKardexDto): Promise<KardexListResponseDto> {
    const {
      page = 1,
      limit = 10,
      userId,
      cadastroId,
      acao,
      dataInicial,
      dataFinal,
    } = params;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (cadastroId) {
      where.cadastroId = cadastroId;
    }

    if (acao) {
      where.acao = acao;
    }

    if (dataInicial || dataFinal) {
      where.createdAt = {};
      if (dataInicial) {
        where.createdAt.gte = new Date(dataInicial);
      }
      if (dataFinal) {
        where.createdAt.lte = new Date(dataFinal);
      }
    }

    const [kardex, total] = await Promise.all([
      this.prisma.kardexVoto.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          kardexId: true,
          userId: true,
          cadastroId: true,
          acao: true,
          ip: true,
          userAgent: true,
          observacoes: true,
          createdAt: true,
        },
      }),
      this.prisma.kardexVoto.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      kardex,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async registrarAcao(
    userId: string,
    cadastroId: string,
    acao: AcaoKardex,
    observacoes?: string,
    ip?: string,
    userAgent?: string,
  ): Promise<KardexVotoDto> {
    const kardex = await this.prisma.kardexVoto.create({
      data: {
        userId,
        cadastroId,
        acao,
        observacoes,
        ip,
        userAgent,
      },
    });

    return {
      kardexId: kardex.kardexId,
      userId: kardex.userId,
      cadastroId: kardex.cadastroId,
      acao: kardex.acao,
      ip: kardex.ip,
      userAgent: kardex.userAgent,
      observacoes: kardex.observacoes,
      createdAt: kardex.createdAt,
    };
  }

  async obterEstatisticasKardex() {
    const estatisticas = await this.prisma.kardexVoto.groupBy({
      by: ['acao'],
      _count: {
        acao: true,
      },
      orderBy: {
        _count: {
          acao: 'desc',
        },
      },
    });

    const totalRegistros = await this.prisma.kardexVoto.count();

    return {
      totalRegistros,
      porAcao: estatisticas.map((stat) => ({
        acao: stat.acao,
        quantidade: stat._count.acao,
      })),
    };
  }

  async obterHistoricoUsuario(
    userId: string,
    limit = 50,
  ): Promise<KardexVotoDto[]> {
    const kardex = await this.prisma.kardexVoto.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        kardexId: true,
        userId: true,
        cadastroId: true,
        acao: true,
        ip: true,
        userAgent: true,
        observacoes: true,
        createdAt: true,
      },
    });

    return kardex;
  }

  async obterHistoricoCadastro(
    cadastroId: string,
    limit = 50,
  ): Promise<KardexVotoDto[]> {
    const kardex = await this.prisma.kardexVoto.findMany({
      where: { cadastroId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        kardexId: true,
        userId: true,
        cadastroId: true,
        acao: true,
        ip: true,
        userAgent: true,
        observacoes: true,
        createdAt: true,
      },
    });

    return kardex;
  }

  async limparKardexAntigo(diasParaManter = 90): Promise<number> {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - diasParaManter);

    const resultado = await this.prisma.kardexVoto.deleteMany({
      where: {
        createdAt: {
          lt: dataLimite,
        },
      },
    });

    return resultado.count;
  }
}
