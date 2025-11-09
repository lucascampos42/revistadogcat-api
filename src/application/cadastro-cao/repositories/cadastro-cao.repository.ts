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

  async create(
    userId: string,
    data: CreateCadastroCaoDto & {
      fotoPerfil: string;
      fotoLateral: string;
      pedigreeFrente?: string;
      pedigreeVerso?: string;
    },
    status: string,
  ): Promise<CadastroCaoEntity> {
    const {
      proprietarioId,
      fotoPerfil,
      fotoLateral,
      pedigreeFrente,
      pedigreeVerso,
      ...restOfData
    } = data;

    const toBoolean = (val: any): boolean | undefined => {
      if (val === undefined || val === null || val === '') return undefined;
      if (typeof val === 'boolean') return val;
      if (typeof val === 'string') {
        const v = val.trim().toLowerCase();
        if (v === 'true') return true;
        if (v === 'false') return false;
      }
      return Boolean(val);
    };

    const sanitizedData: any = {
      ...restOfData,
      temPedigree: toBoolean((restOfData as any).temPedigree),
      temMicrochip: toBoolean((restOfData as any).temMicrochip),
    };

    console.log('[CadastroCaoRepository.create] tipos antes do prisma:', {
      temPedigree: {
        value: sanitizedData.temPedigree,
        typeof: typeof sanitizedData.temPedigree,
      },
      temMicrochip: {
        value: sanitizedData.temMicrochip,
        typeof: typeof sanitizedData.temMicrochip,
      },
    });

    const cadastro = await this.prisma.cadastroCao.create({
      data: {
        ...sanitizedData,
        userId: userId,
        dataNascimento: new Date(data.dataNascimento),
        fotoPerfil,
        fotoLateral,
        pedigreeFrente: pedigreeFrente || null,
        pedigreeVerso: pedigreeVerso || null,
        status,
      },
      include: { raca: true },
    });

    return new CadastroCaoEntity(cadastro);
  }

  async findAll(
    params: ListCadastrosCaoDto,
  ): Promise<{ data: CadastroCaoEntity[]; total: number }> {
    const page = parseInt(params.page || '1');
    const limit = Math.min(parseInt(params.limit || '10'), 50);
    const skip = (page - 1) * limit;

    const where: Prisma.CadastroCaoWhereInput = {
      deletedAt: null,
    };

    if (params.search) {
      where.nome = { contains: params.search, mode: 'insensitive' };
    }

    if (params.raca) {
      where.raca = { nome: { contains: params.raca, mode: 'insensitive' } };
    }

    if (params.sexo) {
      where.sexo = params.sexo;
    }

    if (params.status) {
      where.status = params.status as any;
    }

    if (params.ativo !== undefined) {
      where.ativo = params.ativo === 'true';
    }

    if (params.pendentesValidacao === 'true') {
      where.status = 'CADASTRO_INCOMPLETO';
    }

    if (params.cidade || params.estado) {
      const someFilter: Prisma.EnderecoWhereInput = {};
      if (params.cidade) {
        someFilter.cidade = { contains: params.cidade, mode: 'insensitive' };
      }
      if (params.estado) {
        someFilter.estado = { contains: params.estado, mode: 'insensitive' };
      }
      where.user = {
        enderecos: {
          some: someFilter,
        },
      };
    }

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
          raca: true,
        },
      }),
      this.prisma.cadastroCao.count({ where }),
    ]);

    return {
      data: cadastros.map((cadastro) => new CadastroCaoEntity(cadastro)),
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
        raca: true,
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
      include: { raca: true },
    });

    return cadastros.map((cadastro) => new CadastroCaoEntity(cadastro));
  }

  async update(
    cadastroId: string,
    data: UpdateCadastroCaoDto,
  ): Promise<CadastroCaoEntity> {
    const toBoolean = (val: any): boolean | undefined => {
      if (val === undefined || val === null || val === '') return undefined;
      if (typeof val === 'boolean') return val;
      if (typeof val === 'string') {
        const v = val.trim().toLowerCase();
        if (v === 'true') return true;
        if (v === 'false') return false;
      }
      return Boolean(val);
    };

    const updateData: any = { ...data };

    if (data.dataNascimento) {
      updateData.dataNascimento = new Date(data.dataNascimento);
    }

    if (data.racaId) {
      updateData.raca = { connect: { racaId: data.racaId } };
      delete updateData.racaId;
    }

    // Normalização defensiva em updates também (caso o front envie strings)
    if (updateData.temPedigree !== undefined) {
      updateData.temPedigree = toBoolean(updateData.temPedigree);
    }
    if (updateData.temMicrochip !== undefined) {
      updateData.temMicrochip = toBoolean(updateData.temMicrochip);
    }

    // eslint-disable-next-line no-console
    console.log('[CadastroCaoRepository.update] tipos antes do prisma:', {
      temPedigree: {
        value: updateData.temPedigree,
        typeof: typeof updateData.temPedigree,
      },
      temMicrochip: {
        value: updateData.temMicrochip,
        typeof: typeof updateData.temMicrochip,
      },
    });

    const cadastro = await this.prisma.cadastroCao.update({
      where: { cadastroId },
      data: updateData,
      include: { raca: true },
    });

    return new CadastroCaoEntity(cadastro);
  }

  async delete(cadastroId: string): Promise<void> {
    await this.prisma.cadastroCao.update({
      where: { cadastroId },
      data: { deletedAt: new Date() },
    });
  }

  async findByRaca(
    raca: string,
    limit: number = 10,
  ): Promise<CadastroCaoEntity[]> {
    const cadastros = await this.prisma.cadastroCao.findMany({
      where: {
        deletedAt: null,
        raca: { nome: { contains: raca, mode: 'insensitive' } },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: { raca: true },
    });

    return cadastros.map((cadastro) => new CadastroCaoEntity(cadastro));
  }

  async findBySexo(
    sexo: string,
    limit: number = 10,
  ): Promise<CadastroCaoEntity[]> {
    const cadastros = await this.prisma.cadastroCao.findMany({
      where: {
        deletedAt: null,
        sexo: sexo as any,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: { raca: true },
    });

    return cadastros.map((cadastro) => new CadastroCaoEntity(cadastro));
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
      include: { raca: true },
    });

    return cadastros.map((cadastro) => new CadastroCaoEntity(cadastro));
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
      include: { raca: true },
    });

    return cadastros.map((cadastro) => new CadastroCaoEntity(cadastro));
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
      include: { raca: true },
    });

    return cadastros.map((cadastro) => new CadastroCaoEntity(cadastro));
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
        raca: true,
      },
    });

    return cadastros.map((cadastro) => new CadastroCaoEntity(cadastro));
  }

  /**
   * Aprova um cadastro de cão
   */
  async aprovarCadastro(
    cadastroId: string,
    aprovadoPor: string,
  ): Promise<CadastroCaoEntity> {
    const cadastro = await this.prisma.cadastroCao.update({
      where: { cadastroId },
      data: {
        status: 'APROVADO',
        aprovadoPor,
        aprovadoEm: new Date(),
        motivoRejeicao: null,
      },
      include: { raca: true },
    });

    return new CadastroCaoEntity(cadastro);
  }

  /**
   * Rejeita um cadastro de cão
   */
  async rejeitarCadastro(
    cadastroId: string,
    motivoRejeicao: string,
    aprovadoPor: string,
  ): Promise<CadastroCaoEntity> {
    const cadastro = await this.prisma.cadastroCao.update({
      where: { cadastroId },
      data: {
        status: 'REJEITADO',
        motivoRejeicao,
        aprovadoPor,
        aprovadoEm: new Date(),
        ativo: false,
      },
      include: { raca: true },
    });

    return new CadastroCaoEntity(cadastro);
  }

  async countPendentesValidacao(): Promise<number> {
    return this.prisma.cadastroCao.count({
      where: {
        status: 'CADASTRO_INCOMPLETO',
        deletedAt: null,
      },
    });
  }

  async findPendentesValidacao(
    limit: number = 50,
  ): Promise<CadastroCaoEntity[]> {
    const cadastros = await this.prisma.cadastroCao.findMany({
      where: {
        status: 'CADASTRO_INCOMPLETO',
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: limit,
      include: {
        user: {
          select: {
            userId: true,
            name: true,
            email: true,
            telefone: true,
          },
        },
        raca: true,
      },
    });

    return cadastros.map((cadastro) => new CadastroCaoEntity(cadastro));
  }


  async findPendentesRaca(limit: number = 50): Promise<CadastroCaoEntity[]> {
    const cadastros = await this.prisma.cadastroCao.findMany({
      where: {
        racaId: null,
        racaSugerida: {
          not: null,
        },
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: limit,
      include: {
        user: {
          select: {
            userId: true,
            name: true,
            email: true,
            telefone: true,
          },
        },
        raca: true,
      },
    });

    return cadastros.map((cadastro) => new CadastroCaoEntity(cadastro));
  }
}
