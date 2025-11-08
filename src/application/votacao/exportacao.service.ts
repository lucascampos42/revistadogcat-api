import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/config/prisma.service';
import { ExportacaoVotosDto } from '../../core/dto';
import { Prisma, AcaoKardex } from '@prisma/client';

interface VotoComRelacoes {
  votoId: string;
  createdAt: Date;
  userId: string;
  cadastroId: string;
  ip: string | null;
  userAgent: string | null;
  user: {
    userId: string;
    name: string;
    email: string;
    role: string;
  };
  cadastro: {
    cadastroId: string;
    nome: string;
    raca?: {
      nome: string;
    } | null;
    user: {
      name: string;
      email: string;
    };
  };
}

interface KardexFiltros {
  dataInicio?: string;
  dataFim?: string;
  userId?: string;
  acao?: AcaoKardex;
}

interface CSVResult {
  filename: string;
  content: string;
  contentType: string;
  size: number;
}

@Injectable()
export class ExportacaoService {
  constructor(private readonly prisma: PrismaService) {}

  async exportarVotos(params: ExportacaoVotosDto): Promise<string> {
    const where: Prisma.VotoWhereInput = {};

    // Aplicar filtros de data
    if (params.dataInicial) {
      where.createdAt = { gte: new Date(params.dataInicial) };
    }

    if (params.dataFinal) {
      if (
        where.createdAt &&
        typeof where.createdAt === 'object' &&
        'gte' in where.createdAt
      ) {
        (where.createdAt as Prisma.DateTimeFilter).lte = new Date(
          params.dataFinal,
        );
      } else {
        where.createdAt = { lte: new Date(params.dataFinal) };
      }
    }

    if (params.userId) {
      where.userId = params.userId;
    }

    if (params.cadastroId) {
      where.cadastroId = params.cadastroId;
    }

    const votos = await this.prisma.voto.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            userId: true,
            name: true,
            email: true,
            role: true,
          },
        },
        cadastro: {
          select: {
            cadastroId: true,
            nome: true,
            raca: {
              select: {
                nome: true,
              },
            },
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return this.gerarCSVVotosDetalhados(votos);
  }

  async exportarKardex(filtros: KardexFiltros = {}): Promise<CSVResult> {
    const where: Prisma.KardexVotoWhereInput = {};

    if (filtros.dataInicio) {
      where.createdAt = { gte: new Date(filtros.dataInicio) };
    }

    if (filtros.dataFim) {
      if (
        where.createdAt &&
        typeof where.createdAt === 'object' &&
        'gte' in where.createdAt
      ) {
        (where.createdAt as Prisma.DateTimeFilter).lte = new Date(
          filtros.dataFim,
        );
      } else {
        where.createdAt = { lte: new Date(filtros.dataFim) };
      }
    }

    if (filtros.userId) {
      where.userId = filtros.userId;
    }

    if (filtros.acao) {
      where.acao = filtros.acao;
    }

    const registros = await this.prisma.kardexVoto.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'Data/Hora',
      'Ação',
      'ID Usuário',
      'ID Cadastro',
      'IP',
      'User Agent',
      'Observações',
    ];

    const linhas = registros.map((registro) => [
      registro.createdAt.toISOString(),
      registro.acao,
      registro.userId || '',
      registro.cadastroId || '',
      registro.ip || '',
      registro.userAgent || '',
      registro.observacoes || '',
    ]);

    return this.formatarCSV(headers, linhas, 'kardex_votos');
  }

  private gerarCSVVotosDetalhados(votos: VotoComRelacoes[]): string {
    const headers = [
      'ID Voto',
      'Data/Hora',
      'ID Usuário',
      'Nome Usuário',
      'Email Usuário',
      'ID Cadastro',
      'Nome Cão',
      'Raça',
      'Dono',
      'IP',
      'User Agent',
    ];

    const linhas = votos.map((voto) => [
      voto.votoId,
      voto.createdAt.toISOString(),
      voto.userId,
      voto.user?.name || '',
      voto.user?.email || '',
      voto.cadastroId,
      voto.cadastro?.nome || '',
      voto.cadastro?.raca?.nome || '',
      voto.cadastro?.user?.name || '',
      voto.ip || '',
      voto.userAgent || '',
    ]);

    return this.gerarCSV(headers, linhas);
  }

  private gerarCSV(headers: string[], linhas: string[][]): string {
    return [headers, ...linhas]
      .map((linha) =>
        linha
          .map((campo) => `"${String(campo).replace(/"/g, '""')}"`)
          .join(','),
      )
      .join('\n');
  }

  private formatarCSV(
    headers: string[],
    linhas: string[][],
    nomeArquivo: string,
  ): CSVResult {
    const csv = this.gerarCSV(headers, linhas);
    const timestamp = new Date().toISOString().split('T')[0];

    return {
      filename: `${nomeArquivo}_${timestamp}.csv`,
      content: csv,
      contentType: 'text/csv; charset=utf-8',
      size: Buffer.byteLength(csv, 'utf8'),
    };
  }
}
