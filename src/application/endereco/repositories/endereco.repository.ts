import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/config/prisma.service';
import { Endereco, TipoEndereco } from '@prisma/client';
import { CreateEnderecoDto, UpdateEnderecoDto } from '../dto';
import { IEnderecoRepository, EnderecoFilters } from './endereco.repository.interface';

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

  async findById(enderecoId: string): Promise<Endereco | null> {
    return this.prisma.endereco.findUnique({
      where: { enderecoId },
    });
  }

  async findByUserId(userId: string, filters?: EnderecoFilters): Promise<Endereco[]> {
    const where: any = { userId };

    if (filters?.ativo !== undefined) {
      where.ativo = filters.ativo;
    }

    if (filters?.tipo) {
      where.tipo = filters.tipo;
    }

    return this.prisma.endereco.findMany({
      where,
      orderBy: [
        { principal: 'desc' }, // Endereço principal primeiro
        { createdAt: 'desc' },
      ],
    });
  }

  async findPrincipalByUserId(userId: string): Promise<Endereco | null> {
    return this.prisma.endereco.findFirst({
      where: {
        userId,
        principal: true,
        ativo: true,
      },
    });
  }

  async update(enderecoId: string, data: UpdateEnderecoDto): Promise<Endereco> {
    return this.prisma.endereco.update({
      where: { enderecoId },
      data,
    });
  }

  async delete(enderecoId: string): Promise<void> {
    await this.prisma.endereco.delete({
      where: { enderecoId },
    });
  }

  async setPrincipal(enderecoId: string, userId: string): Promise<Endereco> {
    // Usar transação para garantir que apenas um endereço seja principal
    return this.prisma.$transaction(async (tx) => {
      // Remover principal de todos os outros endereços do usuário
      await tx.endereco.updateMany({
        where: {
          userId,
          principal: true,
        },
        data: {
          principal: false,
        },
      });

      // Definir o endereço atual como principal
      return tx.endereco.update({
        where: { enderecoId },
        data: { principal: true },
      });
    });
  }

  async deactivate(enderecoId: string): Promise<Endereco> {
    return this.prisma.endereco.update({
      where: { enderecoId },
      data: { ativo: false },
    });
  }

  async reactivate(enderecoId: string): Promise<Endereco> {
    return this.prisma.endereco.update({
      where: { enderecoId },
      data: { ativo: true },
    });
  }

  async countActiveByUserId(userId: string): Promise<number> {
    return this.prisma.endereco.count({
      where: {
        userId,
        ativo: true,
      },
    });
  }

  async countByUserId(userId: string): Promise<number> {
    return this.prisma.endereco.count({
      where: { userId },
    });
  }
}