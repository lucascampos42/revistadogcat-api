import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { EdicaoRepository } from './repositories/edicao.repository';
import { CreateEdicaoDto } from './dto/create-edicao.dto';
import { Edicao } from '@prisma/client';
import { EdicaoResponseDto } from './dto/edicao-response.dto';
import { PdfProcessorService } from '../../core/services/pdf-processor.service';
import { randomUUID } from 'crypto';
import { join } from 'path';

@Injectable()
export class EdicaoService {
  private readonly logger = new Logger(EdicaoService.name);

  constructor(
    private readonly edicaoRepository: EdicaoRepository,
    private readonly pdfProcessorService: PdfProcessorService,
  ) {}

  private buildPublicUrl(url?: string | null): string | undefined {
    if (!url) return undefined;
    const base = process.env.PUBLIC_BASE_URL || '';
    const normalizedBase = base.replace(/\/+$/, '');
    const normalizedPath = url.startsWith('/') ? url : `/${url}`;
    return normalizedBase ? `${normalizedBase}${normalizedPath}` : normalizedPath;
  }

  private toResponseDto = (edicao: Edicao): EdicaoResponseDto => {
    return {
      id: edicao.edicaoId,
      titulo: edicao.titulo,
      descricao: edicao.descricao || undefined,
      data: edicao.data,
      pdfUrl: this.buildPublicUrl(edicao.pdfUrl)!,
      capaUrl: this.buildPublicUrl(edicao.capaUrl),
    };
  };

  async list(params: {
    ano?: number;
    page?: number;
    limit?: number;
  }): Promise<EdicaoResponseDto[]> {
    const edicoes = await this.edicaoRepository.findAll(params);
    return edicoes.map((e) => this.toResponseDto(e));
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

    // Valida se o PDF é válido
    const isValidPdf = await this.pdfProcessorService.validatePdf(pdf.path);
    if (!isValidPdf) {
      throw new BadRequestException('Arquivo PDF inválido ou corrompido');
    }

    const capa = files.capa?.[0];
    const edicaoId = dto.id || randomUUID();

    const pdfUrl = `/uploads/revista/${pdf.filename}`;
    let capaUrl: string | undefined;

    try {
      if (capa) {
        // Se capa foi fornecida, usa ela
        capaUrl = `/uploads/revista/capas/${capa.filename}`;
        this.logger.log(`Usando capa fornecida para edição ${edicaoId}`);
      } else {
        // Se não foi fornecida capa, extrai do PDF
        this.logger.log(`Gerando capa automaticamente para edição ${edicaoId}`);
        const capaDir = join(process.cwd(), 'uploads/revista/capas');
        const capaFilename = `capa-${edicaoId}`;

        capaUrl = await this.pdfProcessorService.extractFirstPageAsImage(
          pdf.path,
          capaDir,
          capaFilename,
        );

        this.logger.log(`Capa gerada automaticamente: ${capaUrl}`);
      }

      const created = await this.edicaoRepository.create({
        edicaoId,
        titulo: dto.titulo,
        descricao: dto.descricao,
        data: dto.data ? new Date(dto.data) : new Date(),
        pdfUrl,
        capaUrl,
      });

      this.logger.log(`Edição criada com sucesso: ${edicaoId}`);
      return this.toResponseDto(created);
    } catch (error) {
      this.logger.error(`Erro ao criar edição: ${error.message}`, error.stack);

      // Em caso de erro, remove arquivos que possam ter sido criados
      try {
        await this.pdfProcessorService.removeFile(pdf.path);
        if (capa) {
          await this.pdfProcessorService.removeFile(capa.path);
        }
      } catch (cleanupError) {
        this.logger.warn(
          `Erro na limpeza de arquivos: ${cleanupError.message}`,
        );
      }

      throw new BadRequestException(`Falha ao criar edição: ${error.message}`);
    }
  }

  async update(
    id: string,
    dto: Partial<CreateEdicaoDto>,
    files: { pdf?: Express.Multer.File[]; capa?: Express.Multer.File[] },
  ): Promise<EdicaoResponseDto> {
    const edicao = await this.edicaoRepository.findById(id);
    if (!edicao || (edicao as any).deletedAt) {
      throw new NotFoundException('Edição não encontrada');
    }

    const pdf = files.pdf?.[0];
    const capa = files.capa?.[0];

    let pdfUrl = edicao.pdfUrl;
    let capaUrl = edicao.capaUrl || undefined;

    try {
      if (pdf) {
        const isValidPdf = await this.pdfProcessorService.validatePdf(pdf.path);
        if (!isValidPdf) {
          throw new BadRequestException('Arquivo PDF inválido ou corrompido');
        }
        // Remove PDF antigo
        await this.pdfProcessorService.removeFile(edicao.pdfUrl);
        pdfUrl = `/uploads/revista/${pdf.filename}`;
      }

      if (capa) {
        await this.pdfProcessorService.removeFile(edicao.capaUrl || '');
        capaUrl = `/uploads/revista/capas/${capa.filename}`;
      } else if (pdf) {
        // Se trocou PDF e não enviou capa, regenera capa
        const capaDir = join(process.cwd(), 'uploads/revista/capas');
        const capaFilename = `capa-${id}`;
        capaUrl = await this.pdfProcessorService.extractFirstPageAsImage(
          pdf.path,
          capaDir,
          capaFilename,
        );
      }

      const updated = await this.edicaoRepository.update(id, {
        titulo: dto.titulo ?? edicao.titulo,
        descricao: dto.descricao ?? edicao.descricao ?? undefined,
        data: dto.data ? new Date(dto.data) : edicao.data,
        pdfUrl,
        capaUrl,
        edicaoId: edicao.edicaoId,
      });

      return this.toResponseDto(updated);
    } catch (error) {
      this.logger.error(`Erro ao atualizar edição: ${error.message}`, error.stack);
      throw new BadRequestException(`Falha ao atualizar edição: ${error.message}`);
    }
  }

  /**
   * Exclui uma edição permanentemente, removendo registro do banco e arquivos associados
   * @param id ID da edição a ser excluída
   */
  async delete(id: string): Promise<void> {
    // Busca a edição para obter os caminhos dos arquivos
    const edicao = await this.edicaoRepository.findById(id);
    if (!edicao) {
      throw new NotFoundException('Edição não encontrada');
    }

    this.logger.log(`Iniciando exclusão da edição: ${id}`);

    try {
      // Soft delete do registro
      await this.edicaoRepository.softDelete(id);
      this.logger.log(`Registro da edição ${id} marcado como excluído`);

      // Remove os arquivos associados
      const filesToRemove: Promise<void>[] = [];

      if (edicao.pdfUrl) {
        filesToRemove.push(this.pdfProcessorService.removeFile(edicao.pdfUrl));
      }

      if (edicao.capaUrl) {
        filesToRemove.push(this.pdfProcessorService.removeFile(edicao.capaUrl));
      }

      // Executa remoção dos arquivos em paralelo
      await Promise.allSettled(filesToRemove);

      this.logger.log(`Edição ${id} excluída com sucesso`);
    } catch (error) {
      this.logger.error(
        `Erro ao excluir edição ${id}: ${error.message}`,
        error.stack,
      );

      if ((error as any).code !== 'P2025') {
        // P2025 = registro não encontrado no Prisma
        throw new BadRequestException(
          `Falha ao excluir edição: ${error.message}`,
        );
      }

      throw new NotFoundException('Edição não encontrada');
    }
  }
}
