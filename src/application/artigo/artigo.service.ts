import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ArtigoRepository } from './repositories/artigo.repository';
import { CreateArtigoDto } from './dto/create-artigo.dto';
import { UpdateArtigoDto } from './dto/update-artigo.dto';
import { ListArtigosDto, ArtigosListResponseDto } from './dto/list-artigos.dto';
import { ArtigoResponseDto } from './dto/artigo-response.dto';
import { ArtigoEntity } from './entities/artigo.entity';
import { StatusArtigo } from '@prisma/client';

@Injectable()
export class ArtigoService {
  constructor(private readonly artigoRepository: ArtigoRepository) {}

  async create(createArtigoDto: CreateArtigoDto): Promise<ArtigoResponseDto> {
    // Validar data de publicação
    const dataPublicacao = new Date(createArtigoDto.dataPublicacao);
    if (isNaN(dataPublicacao.getTime())) {
      throw new BadRequestException('Data de publicação inválida');
    }

    // Se o status for PUBLICADO, validar se a data não é no passado
    if (createArtigoDto.status === StatusArtigo.PUBLICADO && dataPublicacao < new Date()) {
      throw new BadRequestException('Data de publicação não pode ser no passado para artigos publicados');
    }

    const artigo = await this.artigoRepository.create(createArtigoDto);
    return this.mapToResponseDto(artigo);
  }

  async findAll(listArtigosDto: ListArtigosDto): Promise<ArtigosListResponseDto> {
    const { data, total } = await this.artigoRepository.findAll(listArtigosDto);
    
    const page = parseInt(listArtigosDto.page || '1');
    const limit = Math.min(parseInt(listArtigosDto.limit || '10'), 50);
    const totalPages = Math.ceil(total / limit);

    return {
      data: data.map(artigo => this.mapToResponseDto(artigo)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async findPublicados(listArtigosDto: ListArtigosDto): Promise<ArtigosListResponseDto> {
    const { data, total } = await this.artigoRepository.findPublicados(listArtigosDto);
    
    const page = parseInt(listArtigosDto.page || '1');
    const limit = Math.min(parseInt(listArtigosDto.limit || '10'), 50);
    const totalPages = Math.ceil(total / limit);

    return {
      data: data.map(artigo => this.mapToResponseDto(artigo)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async findOne(artigoId: string, incrementView: boolean = false): Promise<ArtigoResponseDto> {
    const artigo = await this.artigoRepository.findById(artigoId);
    
    if (!artigo) {
      throw new NotFoundException('Artigo não encontrado');
    }

    // Incrementar visualizações se solicitado
    if (incrementView) {
      await this.artigoRepository.incrementVisualizacoes(artigoId);
      artigo.incrementarVisualizacoes();
    }

    return this.mapToResponseDto(artigo);
  }

  async update(artigoId: string, updateArtigoDto: UpdateArtigoDto): Promise<ArtigoResponseDto> {
    const existingArtigo = await this.artigoRepository.findById(artigoId);
    
    if (!existingArtigo) {
      throw new NotFoundException('Artigo não encontrado');
    }

    // Validar data de publicação se fornecida
    if (updateArtigoDto.dataPublicacao) {
      const dataPublicacao = new Date(updateArtigoDto.dataPublicacao);
      if (isNaN(dataPublicacao.getTime())) {
        throw new BadRequestException('Data de publicação inválida');
      }

      // Se o status for PUBLICADO, validar se a data não é no passado
      const novoStatus = updateArtigoDto.status || existingArtigo.status;
      if (novoStatus === StatusArtigo.PUBLICADO && dataPublicacao < new Date()) {
        throw new BadRequestException('Data de publicação não pode ser no passado para artigos publicados');
      }
    }

    const artigo = await this.artigoRepository.update(artigoId, updateArtigoDto);
    return this.mapToResponseDto(artigo);
  }

  async remove(artigoId: string): Promise<void> {
    const artigo = await this.artigoRepository.findById(artigoId);
    
    if (!artigo) {
      throw new NotFoundException('Artigo não encontrado');
    }

    await this.artigoRepository.delete(artigoId);
  }

  async curtir(artigoId: string): Promise<ArtigoResponseDto> {
    const artigo = await this.artigoRepository.findById(artigoId);
    
    if (!artigo) {
      throw new NotFoundException('Artigo não encontrado');
    }

    if (!artigo.isPublicado()) {
      throw new BadRequestException('Não é possível curtir artigos não publicados');
    }

    await this.artigoRepository.incrementCurtidas(artigoId);
    artigo.incrementarCurtidas();

    return this.mapToResponseDto(artigo);
  }

  async descurtir(artigoId: string): Promise<ArtigoResponseDto> {
    const artigo = await this.artigoRepository.findById(artigoId);
    
    if (!artigo) {
      throw new NotFoundException('Artigo não encontrado');
    }

    if (!artigo.isPublicado()) {
      throw new BadRequestException('Não é possível descurtir artigos não publicados');
    }

    if (artigo.curtidas > 0) {
      await this.artigoRepository.decrementCurtidas(artigoId);
      artigo.decrementarCurtidas();
    }

    return this.mapToResponseDto(artigo);
  }

  async findDestaques(limit: number = 5): Promise<ArtigoResponseDto[]> {
    const artigos = await this.artigoRepository.findDestaques(limit);
    return artigos.map(artigo => this.mapToResponseDto(artigo));
  }

  private mapToResponseDto(artigo: ArtigoEntity): ArtigoResponseDto {
    return {
      artigoId: artigo.artigoId,
      titulo: artigo.titulo,
      conteudo: artigo.conteudo,
      resumo: artigo.resumo || undefined,
      autor: artigo.autor,
      categoria: artigo.categoria,
      status: artigo.status,
      dataPublicacao: artigo.dataPublicacao,
      imagemCapa: artigo.imagemCapa,
      visualizacoes: artigo.visualizacoes,
      curtidas: artigo.curtidas,
      comentarios: artigo.comentarios,
      destaque: artigo.destaque,
      tags: artigo.tags,
      createdAt: artigo.createdAt,
      updatedAt: artigo.updatedAt,
    };
  }
}