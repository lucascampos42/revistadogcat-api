import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { RacaRepository } from './raca.repository';
import { CreateRacaDto } from './dto/create-raca.dto';
import { UpdateRacaDto } from './dto/update-raca.dto';
import { Raca } from '@prisma/client';

@Injectable()
export class RacaService {
  constructor(private readonly racaRepository: RacaRepository) {}

  async create(createRacaDto: CreateRacaDto): Promise<Raca> {
    const existingRaca = await this.racaRepository.findByName(
      createRacaDto.nome,
    );
    if (existingRaca) {
      throw new ConflictException('Uma raça com este nome já existe.');
    }
    return this.racaRepository.create(createRacaDto);
  }

  async findAll(ativo?: boolean, search?: string): Promise<Raca[]> {
    return this.racaRepository.findAll({ ativo, search });
  }

  async findOne(id: string): Promise<Raca> {
    const raca = await this.racaRepository.findById(id);
    if (!raca) {
      throw new NotFoundException(`Raça com ID '${id}' não encontrada.`);
    }
    return raca;
  }

  async update(id: string, updateRacaDto: UpdateRacaDto): Promise<Raca> {
    await this.findOne(id); // Check if it exists
    if (updateRacaDto.nome) {
      const existingRaca = await this.racaRepository.findByName(
        updateRacaDto.nome,
      );
      if (existingRaca && existingRaca.racaId !== id) {
        throw new ConflictException('Uma outra raça com este nome já existe.');
      }
    }
    return this.racaRepository.update(id, updateRacaDto);
  }

  async remove(id: string): Promise<Raca> {
    await this.findOne(id); // Check if it exists
    return this.racaRepository.delete(id);
  }
}
