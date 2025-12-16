import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../core/config/prisma.service';
import { VotacaoRealtimeService } from './votacao-realtime.service';
import { AcaoKardex, VotoTipo } from '@prisma/client';
import {
  CreateVotoDto,
  VotoResponseDto,
  ListVotosDto,
  VotosListResponseDto,
  EstatisticasVotacaoDto,
} from '../../core/dto';

@Injectable()
export class VotacaoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: VotacaoRealtimeService,
  ) {}

  private async emitirEventoAtualizacao(cadastroId: string, tipo: VotoTipo) {
    const cadastro = await this.prisma.cadastroCao.findUnique({
      where: { cadastroId },
      select: { totalVotos: true },
    });
    if (!cadastro) return;

    this.realtime.emitirAtualizacao({
      cadastroId,
      totalVotos: cadastro.totalVotos,
      tipo,
    });
  }

  async votar(
    userId: string,
    createVotoDto: CreateVotoDto,
    ip?: string,
    userAgent?: string,
  ): Promise<VotoResponseDto> {
    const { cadastroId, tipo } = createVotoDto;

    const usuario = await this.prisma.user.findUnique({
      where: { userId },
      select: {
        userId: true,
        active: true,
        blocked: true,
        role: true,
        votosDisponiveisComum: true,
        votosUtilizadosComum: true,
        votosDisponiveisSuper: true,
        votosUtilizadosSuper: true,
      },
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (!usuario.active || usuario.blocked) {
      throw new ForbiddenException('Usuário inativo ou bloqueado');
    }

    const disponiveisPorTipo =
      tipo === VotoTipo.SUPER
        ? usuario.votosDisponiveisSuper
        : usuario.votosDisponiveisComum;
    const utilizadosPorTipo =
      tipo === VotoTipo.SUPER
        ? usuario.votosUtilizadosSuper
        : usuario.votosUtilizadosComum;

    if (
      disponiveisPorTipo !== undefined &&
      utilizadosPorTipo !== undefined &&
      utilizadosPorTipo >= disponiveisPorTipo
    ) {
      throw new BadRequestException(
        `Usuário não possui votos ${tipo === VotoTipo.SUPER ? 'super' : 'comuns'} disponíveis`,
      );
    }

    const cadastro = await this.prisma.cadastroCao.findUnique({
      where: { cadastroId },
      select: {
        cadastroId: true,
        ativo: true,
        userId: true,
        deletedAt: true,
      },
    });

    if (!cadastro) {
      throw new NotFoundException('Cadastro de cão não encontrado');
    }

    if (!cadastro.ativo || cadastro.deletedAt) {
      throw new BadRequestException('Cadastro de cão inativo ou removido');
    }

    if (cadastro.userId === userId) {
      throw new BadRequestException('Não é possível votar no próprio cão');
    }

    const votoExistente = await this.prisma.voto.findUnique({
      where: {
        userId_cadastroId_tipo: {
          userId,
          cadastroId,
          tipo,
        },
      },
    });

    if (votoExistente) {
      throw new BadRequestException('Usuário já votou neste cão');
    }

    const resultado = await this.prisma.$transaction(async (tx) => {
      const novoVoto = await tx.voto.create({
        data: {
          userId,
          cadastroId,
          tipo,
          ip,
          userAgent,
        },
      });

      await tx.user.update({
        where: { userId },
        data: {
          ...(tipo === VotoTipo.SUPER
            ? { votosUtilizadosSuper: { increment: 1 } }
            : { votosUtilizadosComum: { increment: 1 } }),
        },
      });

      await tx.cadastroCao.update({
        where: { cadastroId },
        data: {
          totalVotos: {
            increment: 1,
          },
        },
      });

      await tx.kardexVoto.create({
        data: {
          userId,
          cadastroId,
          acao: AcaoKardex.VOTO_CRIADO,
          tipo,
          ip,
          userAgent,
          observacoes: 'Voto criado com sucesso',
        },
      });

      return novoVoto;
    });

    await this.emitirEventoAtualizacao(cadastroId, tipo);

    return {
      votoId: resultado.votoId,
      userId: resultado.userId,
      cadastroId: resultado.cadastroId,
      tipo: tipo,
      createdAt: resultado.createdAt,
      ip: resultado.ip,
    };
  }

  async removerVoto(
    userId: string,
    cadastroId: string,
    tipo: VotoTipo,
    ip?: string,
    userAgent?: string,
  ): Promise<void> {
    const voto = await this.prisma.voto.findUnique({
      where: {
        userId_cadastroId_tipo: {
          userId,
          cadastroId,
          tipo,
        },
      },
    });

    if (!voto) {
      throw new NotFoundException('Voto não encontrado');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.voto.delete({
        where: {
          userId_cadastroId_tipo: {
            userId,
            cadastroId,
            tipo,
          },
        },
      });

      await tx.user.update({
        where: { userId },
        data: {
          ...(tipo === VotoTipo.SUPER
            ? { votosUtilizadosSuper: { decrement: 1 } }
            : { votosUtilizadosComum: { decrement: 1 } }),
        },
      });

      await tx.cadastroCao.update({
        where: { cadastroId },
        data: {
          totalVotos: {
            decrement: 1,
          },
        },
      });

      await tx.kardexVoto.create({
        data: {
          userId,
          cadastroId,
          acao: AcaoKardex.VOTO_REMOVIDO,
          tipo,
          ip,
          userAgent,
          observacoes: 'Voto removido pelo usuário',
        },
      });
    });

    await this.emitirEventoAtualizacao(cadastroId, tipo);
  }

  async listarVotos(params: ListVotosDto): Promise<VotosListResponseDto> {
    const {
      page = 1,
      limit = 10,
      userId,
      cadastroId,
      dataInicial,
      dataFinal,
    } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (userId) {
      where.OR = [
        { userId: userId },
        { user: { name: { contains: userId, mode: 'insensitive' } } },
      ];
    }

    if (cadastroId) {
      const dogFilter = {
        OR: [
          { cadastroId: cadastroId },
          { cadastro: { nome: { contains: cadastroId, mode: 'insensitive' } } },
        ],
      };

      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          dogFilter
        ];
        delete where.OR;
      } else {
        Object.assign(where, dogFilter);
      }
    }

    if (params.tipo) {
      where.tipo = params.tipo;
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

    const [votos, total] = await Promise.all([
      this.prisma.voto.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          votoId: true,
          userId: true,
          cadastroId: true,
          tipo: true,
          createdAt: true,
          ip: true,
        },
      }),
      this.prisma.voto.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      votos,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async obterEstatisticas(): Promise<EstatisticasVotacaoDto> {
    const [totalVotos, totalUsuariosVotaram, totalCaesComVotos, caoMaisVotado] =
      await Promise.all([
        this.prisma.voto.count(),
        this.prisma.voto
          .groupBy({
            by: ['userId'],
            _count: true,
          })
          .then((result) => result.length),
        this.prisma.cadastroCao.count({
          where: {
            totalVotos: {
              gt: 0,
            },
          },
        }),
        this.prisma.cadastroCao.findFirst({
          where: {
            totalVotos: {
              gt: 0,
            },
          },
          orderBy: {
            totalVotos: 'desc',
          },
          select: {
            cadastroId: true,
            nome: true,
            totalVotos: true,
          },
        }),
      ]);

    const mediaVotosPorCao =
      totalCaesComVotos > 0 ? totalVotos / totalCaesComVotos : 0;

    return {
      totalVotos,
      totalUsuariosVotaram,
      totalCaesComVotos,
      mediaVotosPorCao: Math.round(mediaVotosPorCao * 100) / 100,
      caoMaisVotado,
    };
  }

  async definirVotosDisponiveis(
    userId: string,
    quantidade: number,
  ): Promise<void> {
    if (quantidade < 0) {
      throw new BadRequestException(
        'Quantidade de votos não pode ser negativa',
      );
    }

    await this.prisma.user.update({
      where: { userId },
      data: {
        votosDisponiveisComum: quantidade,
      },
    });
  }

  async resetarVotosUtilizados(userId?: string): Promise<void> {
    const where = userId ? { userId } : {};

    await this.prisma.user.updateMany({
      where,
      data: {
        votosUtilizadosComum: 0,
        votosUtilizadosSuper: 0,
      },
    });
  }

  async invalidarVoto(
    votoId: string,
    adminUserId: string,
    observacoes?: string,
    ip?: string,
    userAgent?: string,
  ): Promise<void> {
    const voto = await this.prisma.voto.findUnique({
      where: { votoId },
    });

    if (!voto) {
      throw new NotFoundException('Voto não encontrado');
    }

    await this.prisma.$transaction(async (tx) => {
      // Remover o voto
      await tx.voto.delete({
        where: { votoId },
      });

      // Atualizar contador de votos do usuário
      await tx.user.update({
        where: { userId: voto.userId },
        data: {
          ...(voto.tipo === VotoTipo.SUPER
            ? { votosUtilizadosSuper: { decrement: 1 } }
            : { votosUtilizadosComum: { decrement: 1 } }),
        },
      });

      // Atualizar contador de votos do cão
      await tx.cadastroCao.update({
        where: { cadastroId: voto.cadastroId },
        data: {
          totalVotos: {
            decrement: 1,
          },
        },
      });

      // Registrar no kardex
      await tx.kardexVoto.create({
        data: {
          userId: voto.userId,
          cadastroId: voto.cadastroId,
          acao: AcaoKardex.VOTO_INVALIDADO,
          tipo: voto.tipo,
          ip,
          userAgent,
          observacoes: `Voto invalidado por admin ${adminUserId}. ${observacoes || ''}`,
        },
      });
    });
  }

  async obterVotosUsuario(userId: string): Promise<VotoResponseDto[]> {
    const votos = await this.prisma.voto.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        votoId: true,
        userId: true,
        cadastroId: true,
        tipo: true,
        createdAt: true,
        ip: true,
      },
    });

    return votos;
  }
}
