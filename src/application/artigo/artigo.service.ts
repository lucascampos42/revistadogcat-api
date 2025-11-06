import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ArtigoRepository } from './repositories/artigo.repository';
import { ComentarioRepository } from './repositories/comentario.repository';
import { ArtigoViewRepository } from './repositories/artigo-view.repository';
import { ArtigoCurtidaRepository } from './repositories/artigo-curtida.repository';
import { CreateArtigoDto } from './dto/create-artigo.dto';
import { UpdateArtigoDto } from './dto/update-artigo.dto';
import { ListArtigosDto, ArtigosListResponseDto } from './dto/list-artigos.dto';
import { ArtigoResponseDto } from './dto/artigo-response.dto';
import { ComentarioResponseDto } from './dto/comentario-response.dto';
import { CreateComentarioDto } from './dto/create-comentario.dto';
import { UpdateComentarioDto } from './dto/update-comentario.dto';
import { ViewArtigoDto, ViewStatsResponseDto } from './dto/view-artigo.dto';
import {
  CurtirArtigoDto,
  ToggleCurtidaResponseDto,
} from './dto/curtir-artigo.dto';
import { ArtigoEntity } from './entities/artigo.entity';
import { ComentarioEntity } from './entities/comentario.entity';
import { StatusArtigo } from '@prisma/client';

@Injectable()
export class ArtigoService {
  constructor(
    private readonly artigoRepository: ArtigoRepository,
    private readonly comentarioRepository: ComentarioRepository,
    private readonly artigoViewRepository: ArtigoViewRepository,
    private readonly artigoCurtidaRepository: ArtigoCurtidaRepository,
  ) {}

  async create(createArtigoDto: CreateArtigoDto): Promise<ArtigoResponseDto> {
    const dataPublicacao = new Date(createArtigoDto.dataPublicacao);
    if (isNaN(dataPublicacao.getTime())) {
      throw new BadRequestException('Data de publicação inválida');
    }

    const artigo = await this.artigoRepository.create(createArtigoDto);
    return this.mapToResponseDto(artigo);
  }

  async findAll(
    listArtigosDto: ListArtigosDto,
  ): Promise<ArtigosListResponseDto> {
    const { data, total } = await this.artigoRepository.findAll(listArtigosDto);
    const page = parseInt(listArtigosDto.page || '1');
    const limit = Math.min(parseInt(listArtigosDto.limit || '10'), 50);
    const totalPages = Math.ceil(total / limit);

    return {
      data: data.map((artigo) => this.mapToResponseDto(artigo)),
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

  async findPublicados(
    listArtigosDto: ListArtigosDto,
  ): Promise<ArtigosListResponseDto> {
    const { data, total } =
      await this.artigoRepository.findPublicados(listArtigosDto);
    const page = parseInt(listArtigosDto.page || '1');
    const limit = Math.min(parseInt(listArtigosDto.limit || '10'), 50);
    const totalPages = Math.ceil(total / limit);

    return {
      data: data.map((artigo) => this.mapToResponseDto(artigo)),
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

  async findOne(
    artigoId: string,
    incrementView: boolean = false,
  ): Promise<ArtigoResponseDto> {
    const artigo = await this.artigoRepository.findById(artigoId);
    if (!artigo) {
      throw new NotFoundException('Artigo não encontrado');
    }

    if (incrementView) {
      await this.artigoRepository.incrementVisualizacoes(artigoId);
      artigo.incrementarVisualizacoes();
    }

    return this.mapToResponseDto(artigo);
  }

  /**
   * Registra uma visualização de artigo com controle por fingerprint
   */
  async registrarVisualizacao(
    artigoId: string,
    viewData: ViewArtigoDto,
  ): Promise<ViewStatsResponseDto> {
    const artigo = await this.artigoRepository.findById(artigoId);
    if (!artigo || !artigo.isPublicado()) {
      throw new NotFoundException('Artigo publicado não encontrado');
    }

    const hasRecentView = await this.artigoViewRepository.hasRecentView(
      artigoId,
      viewData.fingerprint,
    );

    let contabilizada = false;

    if (!hasRecentView) {
      await this.artigoViewRepository.createView(artigoId, viewData);
      await this.artigoRepository.incrementVisualizacoes(artigoId);
      contabilizada = true;
    }

    const totalViews =
      await this.artigoViewRepository.countTotalViews(artigoId);

    return {
      totalViews,
      contabilizada,
    };
  }

  /**
   * Verifica se um fingerprint já visualizou o artigo
   */
  async verificarVisualizacao(
    artigoId: string,
    fingerprint: string,
  ): Promise<boolean> {
    return await this.artigoViewRepository.hasRecentView(artigoId, fingerprint);
  }

  async update(
    artigoId: string,
    updateArtigoDto: UpdateArtigoDto,
  ): Promise<ArtigoResponseDto> {
    const existingArtigo = await this.artigoRepository.findById(artigoId);
    if (!existingArtigo) {
      throw new NotFoundException('Artigo não encontrado');
    }

    if (updateArtigoDto.dataPublicacao) {
      const dataPublicacao = new Date(updateArtigoDto.dataPublicacao);
      if (isNaN(dataPublicacao.getTime())) {
        throw new BadRequestException('Data de publicação inválida');
      }
    }

    const artigo = await this.artigoRepository.update(
      artigoId,
      updateArtigoDto,
    );

    return this.mapToResponseDto(artigo);
  }

  async remove(artigoId: string): Promise<void> {
    const artigo = await this.artigoRepository.findById(artigoId);
    if (!artigo) {
      throw new NotFoundException('Artigo não encontrado');
    }
    await this.artigoRepository.delete(artigoId);
  }

  /**
   * Toggle curtida em um artigo (adiciona ou remove baseado no fingerprint)
   */
  async toggleCurtida(
    artigoId: string,
    curtidaData: CurtirArtigoDto,
  ): Promise<ToggleCurtidaResponseDto> {
    const artigo = await this.artigoRepository.findById(artigoId);
    if (!artigo || !artigo.isPublicado()) {
      throw new NotFoundException('Artigo publicado não encontrado');
    }

    const result = await this.artigoCurtidaRepository.toggleCurtida(
      artigoId,
      curtidaData,
    );

    await this.artigoRepository.setCurtidas(artigoId, result.total);

    return {
      curtido: result.curtido,
      totalCurtidas: result.total,
    };
  }

  async verificarCurtida(
    artigoId: string,
    fingerprint: string,
  ): Promise<boolean> {
    return await this.artigoCurtidaRepository.hasCurtida(artigoId, fingerprint);
  }

  /**
   * Obtém estatísticas de curtidas de um artigo
   */
  async obterEstatisticasCurtidas(artigoId: string, days: number = 30) {
    const artigo = await this.artigoRepository.findById(artigoId);
    if (!artigo) {
      throw new NotFoundException('Artigo não encontrado');
    }

    return await this.artigoCurtidaRepository.getCurtidaStats(artigoId, days);
  }

  async obterEstatisticasVisualizacoes(artigoId: string, days: number = 30) {
    const artigo = await this.artigoRepository.findById(artigoId);
    if (!artigo) {
      throw new NotFoundException('Artigo não encontrado');
    }

    return await this.artigoViewRepository.getViewStats(artigoId, days);
  }

  // --- Métodos legados (manter compatibilidade) ---

  async curtir(artigoId: string): Promise<ArtigoResponseDto> {
    const artigo = await this.artigoRepository.findById(artigoId);
    if (!artigo || !artigo.isPublicado()) {
      throw new NotFoundException('Artigo publicado não encontrado');
    }

    await this.artigoRepository.incrementCurtidas(artigoId);
    artigo.incrementarCurtidas();
    return this.mapToResponseDto(artigo);
  }

  async descurtir(artigoId: string): Promise<ArtigoResponseDto> {
    const artigo = await this.artigoRepository.findById(artigoId);
    if (!artigo || !artigo.isPublicado()) {
      throw new NotFoundException('Artigo publicado não encontrado');
    }

    if (artigo.curtidas > 0) {
      await this.artigoRepository.decrementCurtidas(artigoId);
      artigo.decrementarCurtidas();
    }

    return this.mapToResponseDto(artigo);
  }

  async findDestaques(limit: number = 5): Promise<ArtigoResponseDto[]> {
    const artigos = await this.artigoRepository.findDestaques(limit);
    return artigos.map((artigo) => this.mapToResponseDto(artigo));
  }

  // --- Comentários ---

  async findComentariosByArtigoId(
    artigoId: string,
  ): Promise<ComentarioResponseDto[]> {
    const comentarios =
      await this.comentarioRepository.findByArtigoId(artigoId);
    return comentarios.map((c) =>
      this.mapComentarioToResponseDto(new ComentarioEntity(c)),
    );
  }

  async addComentario(
    artigoId: string,
    dto: CreateComentarioDto & { autorId: string },
  ): Promise<ComentarioResponseDto> {
    const artigo = await this.artigoRepository.findById(artigoId);
    if (!artigo || !artigo.isPublicado()) {
      throw new NotFoundException(
        'Artigo publicado não encontrado para comentar.',
      );
    }

    const comentario = await this.comentarioRepository.create({
      ...dto,
      artigoId,
    });
    return this.mapComentarioToResponseDto(new ComentarioEntity(comentario));
  }

  async updateComentario(
    comentarioId: string,
    autorId: string,
    dto: UpdateComentarioDto,
  ): Promise<ComentarioResponseDto> {
    const comentario = await this.comentarioRepository.findById(comentarioId);
    if (!comentario) {
      throw new NotFoundException('Comentário não encontrado');
    }

    if (comentario.autorId !== autorId) {
      throw new ForbiddenException(
        'Você não tem permissão para editar este comentário',
      );
    }

    const updatedComentario = await this.comentarioRepository.update(
      comentarioId,
      dto,
    );
    return this.mapComentarioToResponseDto(
      new ComentarioEntity(updatedComentario),
    );
  }

  async deleteComentario(comentarioId: string, autorId: string): Promise<void> {
    const comentario = await this.comentarioRepository.findById(comentarioId);
    if (!comentario) {
      throw new NotFoundException('Comentário não encontrado');
    }

    if (comentario.autorId !== autorId) {
      throw new ForbiddenException(
        'Você não tem permissão para excluir este comentário',
      );
    }

    await this.comentarioRepository.delete(comentarioId);
  }

  // --- Mappers ---

  private mapToResponseDto(artigo: ArtigoEntity): ArtigoResponseDto {
    if (!artigo.autor) {
      Logger.error('ERRO: Autor não encontrado no artigo!');
      Logger.error('ArtigoEntity completa: ' + JSON.stringify(artigo));
    }

    const responseDto = {
      artigoId: artigo.artigoId,
      titulo: artigo.titulo,
      conteudo: artigo.conteudo,
      resumo: artigo.resumo || undefined,
      autor: {
        userId: artigo.autor.userId,
        name: artigo.autor.name,
        avatarUrl: artigo.autor.avatarUrl || undefined,
      },
      categoria: artigo.categoria,
      status: artigo.status,
      dataPublicacao: artigo.dataPublicacao,
      imagemCapa: artigo.imagemCapa ?? undefined,
      visualizacoes: artigo.visualizacoes,
      curtidas: artigo.curtidas,
      comentarios: artigo.comentarios.map((c) =>
        this.mapComentarioToResponseDto(c),
      ),
      destaque: artigo.destaque,
      tags: artigo.tags,
      createdAt: artigo.createdAt,
      updatedAt: artigo.updatedAt,
    };

    return responseDto;
  }

  private mapComentarioToResponseDto(
    comentario: ComentarioEntity,
  ): ComentarioResponseDto {
    return {
      comentarioId: comentario.comentarioId,
      conteudo: comentario.conteudo,
      createdAt: comentario.createdAt,
      updatedAt: comentario.updatedAt,
      artigoId: comentario.artigoId,
      autor: {
        userId: comentario.autor.userId,
        name: comentario.autor.name,
        avatarUrl: comentario.autor.avatarUrl || undefined,
      },
    };
  }
}
