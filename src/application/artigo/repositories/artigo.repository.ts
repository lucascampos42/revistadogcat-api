import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/config/prisma.service';
import { ArtigoEntity } from '../entities/artigo.entity';
import { CreateArtigoDto } from '../dto/create-artigo.dto';
import { UpdateArtigoDto } from '../dto/update-artigo.dto';
import { ListArtigosDto } from '../dto/list-artigos.dto';
import { StatusArtigo, Prisma } from '@prisma/client';

@Injectable()
export class ArtigoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateArtigoDto): Promise<ArtigoEntity> {
    const artigo = await this.prisma.artigo.create({
      data: {
        ...data,
        dataPublicacao: new Date(data.dataPublicacao),
        status: data.status || StatusArtigo.RASCUNHO,
        destaque: data.destaque || false,
        tags: data.tags || [],
      },
    });

    return new ArtigoEntity(artigo);
  }

  async findAll(params: ListArtigosDto): Promise<{ data: ArtigoEntity[]; total: number }> {
    const page = parseInt(params.page || '1');
    const limit = Math.min(parseInt(params.limit || '10'), 50);
    const skip = (page - 1) * limit;

    // Construir filtros
    const where: Prisma.ArtigoWhereInput = {
      deletedAt: null,
    };

    if (params.search) {
      where.OR = [
        { titulo: { contains: params.search, mode: 'insensitive' } },
        { resumo: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.categoria) {
      where.categoria = { contains: params.categoria, mode: 'insensitive' };
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.destaque !== undefined) {
      where.destaque = params.destaque;
    }

    if (params.tag) {
      where.tags = { has: params.tag };
    }

    // Construir ordenação
    const orderBy: Prisma.ArtigoOrderByWithRelationInput = {};
    const sortBy = params.sortBy || 'dataPublicacao';
    const sortOrder = params.sortOrder || 'desc';
    orderBy[sortBy] = sortOrder;

    const [artigos, total] = await Promise.all([
      this.prisma.artigo.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.artigo.count({ where }),
    ]);

    return {
      data: artigos.map(artigo => new ArtigoEntity(artigo)),
      total,
    };
  }

  async findById(artigoId: string): Promise<ArtigoEntity | null> {
    const artigo = await this.prisma.artigo.findFirst({
      where: {
        artigoId,
        deletedAt: null,
      },
    });

    return artigo ? new ArtigoEntity(artigo) : null;
  }

  async update(artigoId: string, data: UpdateArtigoDto): Promise<ArtigoEntity> {
    const updateData: any = { ...data };
    
    if (data.dataPublicacao) {
      updateData.dataPublicacao = new Date(data.dataPublicacao);
    }

    const artigo = await this.prisma.artigo.update({
      where: { artigoId },
      data: updateData,
    });

    return new ArtigoEntity(artigo);
  }

  async delete(artigoId: string): Promise<void> {
    await this.prisma.artigo.update({
      where: { artigoId },
      data: { deletedAt: new Date() },
    });
  }

  async incrementVisualizacoes(artigoId: string): Promise<void> {
    await this.prisma.artigo.update({
      where: { artigoId },
      data: {
        visualizacoes: {
          increment: 1,
        },
      },
    });
  }

  async incrementCurtidas(artigoId: string): Promise<void> {
    await this.prisma.artigo.update({
      where: { artigoId },
      data: {
        curtidas: {
          increment: 1,
        },
      },
    });
  }

  async decrementCurtidas(artigoId: string): Promise<void> {
    await this.prisma.artigo.update({
      where: { artigoId },
      data: {
        curtidas: {
          decrement: 1,
        },
      },
    });
  }

  async findPublicados(params: ListArtigosDto): Promise<{ data: ArtigoEntity[]; total: number }> {
    return this.findAll({
      ...params,
      status: StatusArtigo.PUBLICADO,
    });
  }

  async findDestaques(limit: number = 5): Promise<ArtigoEntity[]> {
    const artigos = await this.prisma.artigo.findMany({
      where: {
        deletedAt: null,
        status: StatusArtigo.PUBLICADO,
        destaque: true,
      },
      orderBy: {
        dataPublicacao: 'desc',
      },
      take: limit,
    });

    return artigos.map(artigo => new ArtigoEntity(artigo));
  }
}