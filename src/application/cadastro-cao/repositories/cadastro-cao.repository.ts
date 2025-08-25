import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/config/prisma.service';
import { CadastroCaoEntity } from '../entities/cadastro-cao.entity';
import { CreateCadastroCaoDto } from '../dto/create-cadastro-cao.dto';
import { UpdateCadastroCaoDto } from '../dto/update-cadastro-cao.dto';
import { ListCadastrosCaoDto } from '../dto/list-cadastros-cao.dto';
import { VideoOption, Prisma } from '@prisma/client';

@Injectable()
export class CadastroCaoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, data: CreateCadastroCaoDto): Promise<CadastroCaoEntity> {
    const cadastro = await this.prisma.cadastroCao.create({
      data: {
        userId,
        ...data,
        dataNascimento: new Date(data.dataNascimento),
        proprietarioDiferente: data.proprietarioDiferente || false,
        temPedigree: data.temPedigree || false,
        temMicrochip: data.temMicrochip || false,
        videoOption: data.videoOption || VideoOption.NONE,
      },
    });

    return new CadastroCaoEntity(cadastro);
  }

  async findAll(params: ListCadastrosCaoDto): Promise<{ data: CadastroCaoEntity[]; total: number }> {
    const page = parseInt(params.page || '1');
    const limit = Math.min(parseInt(params.limit || '10'), 50);
    const skip = (page - 1) * limit;

    // Construir filtros
    const where: Prisma.CadastroCaoWhereInput = {
      deletedAt: null,
    };

    if (params.search) {
      where.nome = { contains: params.search, mode: 'insensitive' };
    }

    if (params.raca) {
      where.raca = { contains: params.raca, mode: 'insensitive' };
    }

    if (params.sexo) {
      where.sexo = params.sexo;
    }

    if (params.cidade) {
      where.OR = [
        { cidade: { contains: params.cidade, mode: 'insensitive' } },
        { user: { enderecos: { some: { cidade: { contains: params.cidade, mode: 'insensitive' } } } } },
      ];
    }

    if (params.estado) {
      where.OR = [
        { estado: { contains: params.estado, mode: 'insensitive' } },
        { user: { enderecos: { some: { estado: { contains: params.estado, mode: 'insensitive' } } } } },
      ];
    }

    // Construir ordenação
    const orderBy: Prisma.CadastroCaoOrderByWithRelationInput = {};
    const sortBy = params.sortBy || 'createdAt';
    const sortOrder = params.sortOrder || 'desc';
    orderBy[sortBy] = sortOrder;

    const [cadastros, total] = await Promise.all([
      this.prisma.cadastroCao.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              userId: true,
              name: true,
              email: true,
              telefone: true,
              enderecos: {
                where: { principal: true },
                select: {
                  cidade: true,
                  estado: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.cadastroCao.count({ where }),
    ]);

    return {
      data: cadastros.map(cadastro => new CadastroCaoEntity(cadastro)),
      total,
    };
  }

  async findById(cadastroId: string): Promise<CadastroCaoEntity | null> {
    const cadastro = await this.prisma.cadastroCao.findFirst({
      where: {
        cadastroId,
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            userId: true,
            name: true,
            email: true,
            telefone: true,
            enderecos: {
              where: { principal: true },
              select: {
                cidade: true,
                estado: true,
              },
            },
          },
        },
      },
    });

    return cadastro ? new CadastroCaoEntity(cadastro) : null;
  }

  async findByUserId(userId: string): Promise<CadastroCaoEntity[]> {
    const cadastros = await this.prisma.cadastroCao.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return cadastros.map(cadastro => new CadastroCaoEntity(cadastro));
  }

  async update(cadastroId: string, data: UpdateCadastroCaoDto): Promise<CadastroCaoEntity> {
    const updateData: any = { ...data };
    
    if (data.dataNascimento) {
      updateData.dataNascimento = new Date(data.dataNascimento);
    }

    const cadastro = await this.prisma.cadastroCao.update({
      where: { cadastroId },
      data: updateData,
    });

    return new CadastroCaoEntity(cadastro);
  }

  async delete(cadastroId: string): Promise<void> {
    await this.prisma.cadastroCao.update({
      where: { cadastroId },
      data: { deletedAt: new Date() },
    });
  }

  async findByRaca(raca: string, limit: number = 10): Promise<CadastroCaoEntity[]> {
    const cadastros = await this.prisma.cadastroCao.findMany({
      where: {
        deletedAt: null,
        raca: { contains: raca, mode: 'insensitive' },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return cadastros.map(cadastro => new CadastroCaoEntity(cadastro));
  }

  async findBySexo(sexo: string, limit: number = 10): Promise<CadastroCaoEntity[]> {
    const cadastros = await this.prisma.cadastroCao.findMany({
      where: {
        deletedAt: null,
        sexo: sexo as any,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return cadastros.map(cadastro => new CadastroCaoEntity(cadastro));
  }

  async findComPedigree(): Promise<CadastroCaoEntity[]> {
    const cadastros = await this.prisma.cadastroCao.findMany({
      where: {
        deletedAt: null,
        temPedigree: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return cadastros.map(cadastro => new CadastroCaoEntity(cadastro));
  }

  async findComMicrochip(): Promise<CadastroCaoEntity[]> {
    const cadastros = await this.prisma.cadastroCao.findMany({
      where: {
        deletedAt: null,
        temMicrochip: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return cadastros.map(cadastro => new CadastroCaoEntity(cadastro));
  }

  async findComVideo(): Promise<CadastroCaoEntity[]> {
    const cadastros = await this.prisma.cadastroCao.findMany({
      where: {
        deletedAt: null,
        videoOption: {
          not: VideoOption.NONE,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return cadastros.map(cadastro => new CadastroCaoEntity(cadastro));
  }

  async countByUserId(userId: string): Promise<number> {
    return this.prisma.cadastroCao.count({
      where: {
        userId,
        deletedAt: null,
      },
    });
  }

  async findRecentCadastros(limit: number = 5): Promise<CadastroCaoEntity[]> {
    const cadastros = await this.prisma.cadastroCao.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        user: {
          select: {
            name: true,
            enderecos: {
              where: { principal: true },
              select: {
                cidade: true,
                estado: true,
              },
            },
          },
        },
      },
    });

    return cadastros.map(cadastro => new CadastroCaoEntity(cadastro));
  }
}