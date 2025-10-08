import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { EdicaoRepository } from './repositories/edicao.repository';
import { FileUploadService } from '../../core/services/file-upload.service';
import { CreateEdicaoDto } from './dto/create-edicao.dto';
import { Edicao } from '@prisma/client';
import { EdicaoResponseDto } from './dto/edicao-response.dto';

function mapBimestreToCode(bimestre: string): string {
  const map: Record<string, string> = {
    'Jan/Fev': '01-02',
    'Fev/Mar': '02-03',
    'Mar/Abr': '03-04',
    'Abr/Mai': '04-05',
    'Mai/Jun': '05-06',
    'Jun/Jul': '06-07',
    'Jul/Ago': '07-08',
    'Ago/Set': '08-09',
    'Set/Out': '09-10',
    'Out/Nov': '10-11',
    'Nov/Dez': '11-12',
    'Dez/Jan': '12-01',
  };
  return map[bimestre] || bimestre.replace(/\s/g, '');
}

@Injectable()
export class EdicaoService {
  constructor(
    private readonly edicaoRepository: EdicaoRepository,
    private readonly fileUploadService: FileUploadService,
  ) {}

  private toResponseDto(edicao: Edicao): EdicaoResponseDto {
    return {
      id: edicao.edicaoId,
      titulo: edicao.titulo,
      bimestre: edicao.bimestre,
      ano: edicao.ano,
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
    if (!pdf || pdf.mimetype !== 'application/pdf') {
      throw new BadRequestException('Arquivo PDF inválido');
    }

    const capa = files.capa?.[0];

    const id = dto.id ?? `${dto.ano}-${mapBimestreToCode(dto.bimestre)}`;

    // Processar arquivos via FileUploadService para garantir resize (capa) e URL consistente
    const processedPdf = await this.fileUploadService.processUploadedFile(
      pdf,
      'magazinePdf',
    );
    const pdfUrl = processedPdf.url;
    const processedCapa = capa
      ? await this.fileUploadService.processUploadedFile(capa, 'magazineCover')
      : undefined;
    const capaUrl = processedCapa?.url;

    const created = await this.edicaoRepository.create({
      edicaoId: id,
      titulo: dto.titulo,
      bimestre: dto.bimestre,
      ano: dto.ano,
      pdfUrl,
      capaUrl,
    });

    return this.toResponseDto(created);
  }
}
