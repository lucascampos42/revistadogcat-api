import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/config/prisma.service';
import { Endereco } from '@prisma/client';
import { CreateEnderecoDto, UpdateEnderecoDto } from '../dto';
import {
  IEnderecoRepository,
  EnderecoFilters,
} from './endereco.repository.interface';

@Injectable()
export class EnderecoRepository implements IEnderecoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, data: CreateEnderecoDto): Promise<Endereco> {
    return this.prisma.endereco.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  async findById(enderecoId: string, userId: string): Promise<Endereco | null> {
    return this.prisma.endereco.findUnique({
      where: { enderecoId, userId },
    });
  }

  async findByUserId(
    userId: string,
    filters?: EnderecoFilters,
  ): Promise<Endereco[]> {
    const where: any = { userId };

    if (filters?.ativo !== undefined) {
      where.ativo = filters.ativo;
    }

    if (filters?.tipo) {
      where.tipo = filters.tipo;
    }

    return this.prisma.endereco.findMany({
      where,
      orderBy: [{ principal: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findPrincipalByUserId(userId: string): Promise<Endereco | null> {
    return this.prisma.endereco.findFirst({
      where: { userId, principal: true, ativo: true },
    });
  }

  async update(
    enderecoId: string,
    userId: string,
    data: UpdateEnderecoDto,
  ): Promise<Endereco> {
    return this.prisma.endereco.update({
      where: { enderecoId, userId },
      data,
    });
  }

  async delete(enderecoId: string, userId: string): Promise<void> {
    await this.prisma.endereco.delete({
      where: { enderecoId, userId },
    });
  }

  async clearPrincipal(userId: string): Promise<void> {
    await this.prisma.endereco.updateMany({
      where: { userId, principal: true },
      data: { principal: false },
    });
  }

  async setPrincipal(enderecoId: string, userId: string): Promise<Endereco> {
    return this.prisma.$transaction(async (tx) => {
      await tx.endereco.updateMany({
        where: { userId, principal: true },
        data: { principal: false },
      });

      return tx.endereco.update({
        where: { enderecoId, userId },
        data: { principal: true },
      });
    });
  }

  async deactivate(enderecoId: string, userId: string): Promise<Endereco> {
    return this.prisma.endereco.update({
      where: { enderecoId, userId },
      data: { ativo: false },
    });
  }

  async reactivate(enderecoId: string, userId: string): Promise<Endereco> {
    return this.prisma.endereco.update({
      where: { enderecoId, userId },
      data: { ativo: true },
    });
  }

  async countActiveByUserId(userId: string): Promise<number> {
    return this.prisma.endereco.count({
      where: { userId, ativo: true },
    });
  }

  async countByUserId(
    userId: string,
    filters?: EnderecoFilters,
  ): Promise<number> {
    const where: any = { userId };
    if (filters?.ativo !== undefined) where.ativo = filters.ativo;
    if (filters?.tipo) where.tipo = filters.tipo;
    return this.prisma.endereco.count({
      where,
    });
  }
}
