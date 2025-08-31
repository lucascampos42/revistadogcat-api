import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/config/prisma.service';
import { Prisma, Comentario } from '@prisma/client';

@Injectable()
export class ComentarioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.ComentarioUncheckedCreateInput): Promise<Comentario> {
    return this.prisma.comentario.create({
      data,
      include: { autor: { select: { userId: true, name: true, avatarUrl: true } } },
    });
  }

  async findById(comentarioId: string): Promise<Comentario | null> {
    return this.prisma.comentario.findUnique({
      where: { comentarioId },
      include: { autor: { select: { userId: true, name: true, avatarUrl: true } } },
    });
  }

  async findByArtigoId(artigoId: string): Promise<Comentario[]> {
    return this.prisma.comentario.findMany({
      where: { artigoId },
      include: { autor: { select: { userId: true, name: true, avatarUrl: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async update(comentarioId: string, data: Prisma.ComentarioUpdateInput): Promise<Comentario> {
    return this.prisma.comentario.update({
      where: { comentarioId },
      data,
      include: { autor: { select: { userId: true, name: true, avatarUrl: true } } },
    });
  }

  async delete(comentarioId: string): Promise<void> {
    await this.prisma.comentario.delete({ where: { comentarioId } });
  }
}
