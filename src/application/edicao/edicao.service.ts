import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { EdicaoRepository } from './repositories/edicao.repository';
import { CreateEdicaoDto } from './dto/create-edicao.dto';
import { Edicao } from '@prisma/client';
import { EdicaoResponseDto } from './dto/edicao-response.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class EdicaoService {
  constructor(private readonly edicaoRepository: EdicaoRepository) {}

  private toResponseDto(edicao: Edicao): EdicaoResponseDto {
    return {
      id: edicao.edicaoId,
      titulo: edicao.titulo,
      descricao: edicao.descricao,
      data: edicao.data,
      pdfUrl: edicao.pdfUrl,
      capaUrl: edicao.capaUrl || undefined,
    };
  }

  async list(params: {
    ano?: number;
    page?: number;
    limit?: number;
  }): Promise<EdicaoResponseDto[]> {
    const edicoes = await this.edicaoRepository.findAll(params);
    return edicoes.map(this.toResponseDto);
  }

  async getById(id: string): Promise<EdicaoResponseDto> {
    const edicao = await this.edicaoRepository.findById(id);
    if (!edicao) {
      throw new NotFoundException('Edição não encontrada');
    }
    return this.toResponseDto(edicao);
  }

  async getUltima(): Promise<EdicaoResponseDto> {
    const edicao = await this.edicaoRepository.findUltima();
    if (!edicao) {
      throw new NotFoundException('Nenhuma edição encontrada');
    }
    return this.toResponseDto(edicao);
  }

  async create(
    dto: CreateEdicaoDto,
    files: { pdf?: Express.Multer.File[]; capa?: Express.Multer.File[] },
  ): Promise<EdicaoResponseDto> {
    const pdf = files.pdf?.[0];
    if (!pdf) {
      throw new BadRequestException('Arquivo PDF é obrigatório');
    }

    const capa = files.capa?.[0];

    const pdfUrl = `/uploads/revista/${pdf.filename}`;
    const capaUrl = capa
      ? `/uploads/revista/capas/${capa.filename}`
      : undefined;

    const created = await this.edicaoRepository.create({
      edicaoId: dto.id || randomUUID(),
      titulo: dto.titulo,
      descricao: dto.descricao,
      data: dto.data ? new Date(dto.data) : new Date(),
      pdfUrl,
      capaUrl,
    });

    return this.toResponseDto(created);
  }
}
