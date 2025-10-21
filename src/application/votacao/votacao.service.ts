import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../core/config/prisma.service';
import { AcaoKardex } from '@prisma/client';
import {
  CreateVotoDto,
  VotoResponseDto,
  ListVotosDto,
  VotosListResponseDto,
  EstatisticasVotacaoDto,
} from '../../core/dto';

@Injectable()
export class VotacaoService {
  constructor(private readonly prisma: PrismaService) {}

  async votar(
    userId: string,
    createVotoDto: CreateVotoDto,
    ip?: string,
    userAgent?: string,
  ): Promise<VotoResponseDto> {
    const { cadastroId } = createVotoDto;

    // Verificar se o usuário existe e está ativo
    const usuario = await this.prisma.user.findUnique({
      where: { userId },
      select: {
        userId: true,
        active: true,
        blocked: true,
        role: true,
        votosDisponiveis: true,
        votosUtilizados: true,
      },
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (!usuario.active || usuario.blocked) {
      throw new ForbiddenException('Usuário inativo ou bloqueado');
    }

    // Verificar se o usuário tem votos disponíveis
    if (usuario.votosUtilizados >= usuario.votosDisponiveis) {
      throw new BadRequestException('Usuário não possui votos disponíveis');
    }

    // Verificar se o cadastro existe e está ativo
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

    // Verificar se o usuário não está tentando votar no próprio cão
    if (cadastro.userId === userId) {
      throw new BadRequestException('Não é possível votar no próprio cão');
    }

    // Verificar se o usuário já votou neste cão
    const votoExistente = await this.prisma.voto.findUnique({
      where: {
        userId_cadastroId: {
          userId,
          cadastroId,
        },
      },
    });

    if (votoExistente) {
      throw new BadRequestException('Usuário já votou neste cão');
    }

    // Criar o voto em uma transação
    const resultado = await this.prisma.$transaction(async (tx) => {
      // Criar o voto
      const novoVoto = await tx.voto.create({
        data: {
          userId,
          cadastroId,
          ip,
          userAgent,
        },
      });

      // Atualizar contador de votos do usuário
      await tx.user.update({
        where: { userId },
        data: {
          votosUtilizados: {
            increment: 1,
          },
        },
      });

      // Atualizar contador de votos do cão
      await tx.cadastroCao.update({
        where: { cadastroId },
        data: {
          totalVotos: {
            increment: 1,
          },
        },
      });

      // Registrar no kardex
      await tx.kardexVoto.create({
        data: {
          userId,
          cadastroId,
          acao: AcaoKardex.VOTO_CRIADO,
          ip,
          userAgent,
          observacoes: 'Voto criado com sucesso',
        },
      });

      return novoVoto;
    });

    return {
      votoId: resultado.votoId,
      userId: resultado.userId,
      cadastroId: resultado.cadastroId,
      createdAt: resultado.createdAt,
      ip: resultado.ip,
    };
  }

  async removerVoto(
    userId: string,
    cadastroId: string,
    ip?: string,
    userAgent?: string,
  ): Promise<void> {
    // Verificar se o voto existe
    const voto = await this.prisma.voto.findUnique({
      where: {
        userId_cadastroId: {
          userId,
          cadastroId,
        },
      },
    });

    if (!voto) {
      throw new NotFoundException('Voto não encontrado');
    }

    // Remover o voto em uma transação
    await this.prisma.$transaction(async (tx) => {
      // Remover o voto
      await tx.voto.delete({
        where: {
          userId_cadastroId: {
            userId,
            cadastroId,
          },
        },
      });

      // Atualizar contador de votos do usuário
      await tx.user.update({
        where: { userId },
        data: {
          votosUtilizados: {
            decrement: 1,
          },
        },
      });

      // Atualizar contador de votos do cão
      await tx.cadastroCao.update({
        where: { cadastroId },
        data: {
          totalVotos: {
            decrement: 1,
          },
        },
      });

      // Registrar no kardex
      await tx.kardexVoto.create({
        data: {
          userId,
          cadastroId,
          acao: AcaoKardex.VOTO_REMOVIDO,
          ip,
          userAgent,
          observacoes: 'Voto removido pelo usuário',
        },
      });
    });
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
      where.userId = userId;
    }

    if (cadastroId) {
      where.cadastroId = cadastroId;
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
        votosDisponiveis: quantidade,
      },
    });
  }

  async resetarVotosUtilizados(userId?: string): Promise<void> {
    const where = userId ? { userId } : {};

    await this.prisma.user.updateMany({
      where,
      data: {
        votosUtilizados: 0,
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
          votosUtilizados: {
            decrement: 1,
          },
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
        createdAt: true,
        ip: true,
      },
    });

    return votos;
  }
}
