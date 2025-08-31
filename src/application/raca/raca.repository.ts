import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/config/prisma.service';
import { Prisma, Raca } from '@prisma/client';
import { CreateRacaDto } from './dto/create-raca.dto';
import { UpdateRacaDto } from './dto/update-raca.dto';

@Injectable()
export class RacaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(createRacaDto: CreateRacaDto): Promise<Raca> {
    return this.prisma.raca.create({
      data: createRacaDto,
    });
  }

  async findAll(params: { ativo?: boolean; search?: string }): Promise<Raca[]> {
    const { ativo, search } = params;
    const where: Prisma.RacaWhereInput = {};

    if (ativo !== undefined) {
      where.ativo = ativo;
    }

    if (search) {
      where.nome = {
        contains: search,
        mode: 'insensitive',
      };
    }

    return this.prisma.raca.findMany({
      where,
      orderBy: {
        nome: 'asc',
      },
    });
  }

  async findById(id: string): Promise<Raca | null> {
    return this.prisma.raca.findUnique({
      where: { racaId: id },
    });
  }

  async findByName(nome: string): Promise<Raca | null> {
    return this.prisma.raca.findUnique({
      where: { nome },
    });
  }

  async update(id: string, updateRacaDto: UpdateRacaDto): Promise<Raca> {
    return this.prisma.raca.update({
      where: { racaId: id },
      data: updateRacaDto,
    });
  }

  async delete(id: string): Promise<Raca> {
    // Soft delete by setting ativo to false
    return this.prisma.raca.update({
      where: { racaId: id },
      data: { ativo: false },
    });
  }
}
