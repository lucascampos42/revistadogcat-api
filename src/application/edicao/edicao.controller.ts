import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { EdicaoService } from './edicao.service';
import { ListEdicoesDto } from './dto/list-edicoes.dto';
import { CreateEdicaoDto } from './dto/create-edicao.dto';
import { EdicaoResponseDto } from './dto/edicao-response.dto';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { IsPublic } from '../../core/decorators/is-public.decorator';

@ApiTags('Edições')
@Controller('edicoes')
export class EdicaoController {
  constructor(private readonly edicaoService: EdicaoService) {}

  // Helpers
  private ensureDir(path: string) {
    if (!existsSync(path)) mkdirSync(path, { recursive: true });
  }

  /**
   * Sanitiza o nome do arquivo removendo caracteres perigosos e normalizando acentos
   * @param filename Nome original do arquivo
   * @returns Nome sanitizado do arquivo
   */
  private static sanitizeFileName(filename: string): string {
    if (!filename || filename.trim().length === 0) {
      return '';
    }

    // Remove espaços no início e fim
    let sanitized = filename.trim();

    // Normaliza caracteres acentuados (NFD = Normalization Form Decomposed)
    sanitized = sanitized.normalize('NFD');

    // Remove diacríticos (acentos)
    sanitized = sanitized.replace(/[\u0300-\u036f]/g, '');

    // Substitui espaços por underscores
    sanitized = sanitized.replace(/\s+/g, '_');

    // Remove caracteres perigosos, mantendo apenas: letras, números, pontos, hífens, underscores e parênteses
    sanitized = sanitized.replace(/[^a-zA-Z0-9._\-()]/g, '');

    // Remove múltiplos pontos consecutivos
    sanitized = sanitized.replace(/\.{2,}/g, '.');

    // Remove múltiplos underscores consecutivos
    sanitized = sanitized.replace(/_{2,}/g, '_');

    // Remove pontos e underscores no início e fim
    sanitized = sanitized.replace(/^[._]+|[._]+$/g, '');

    // Garante que o arquivo tenha pelo menos um caractere válido antes da extensão
    if (sanitized.length === 0) {
      return '';
    }

    // Limita o tamanho do nome (sem extensão) a 100 caracteres
    const parts = sanitized.split('.');
    if (parts.length > 1) {
      const extension = parts.pop();
      const nameWithoutExt = parts.join('.');
      if (nameWithoutExt.length > 100) {
        sanitized = nameWithoutExt.substring(0, 100) + '.' + extension;
      }
    } else if (sanitized.length > 100) {
      sanitized = sanitized.substring(0, 100);
    }

    return sanitized;
  }

  @Get()
  @IsPublic()
  @ApiOperation({ summary: 'Listar edições' })
  @ApiQuery({ name: 'ano', required: false, description: 'Filtrar por ano' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Página (padrão: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Limite por página (padrão: 12)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de edições',
    type: [EdicaoResponseDto],
  })
  async list(@Query() query: ListEdicoesDto): Promise<EdicaoResponseDto[]> {
    return this.edicaoService.list(query);
  }

  @Get(':id')
  @IsPublic()
  @ApiOperation({ summary: 'Obter uma edição por ID' })
  @ApiParam({ name: 'id', description: 'ID da edição' })
  @ApiResponse({
    status: 200,
    description: 'Edição encontrada',
    type: EdicaoResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Edição não encontrada' })
  async getById(@Param('id') id: string): Promise<EdicaoResponseDto> {
    return this.edicaoService.getById(id);
  }

  @Get('ultima')
  @IsPublic()
  @ApiOperation({ summary: 'Obter a última edição' })
  @ApiResponse({
    status: 200,
    description: 'Última edição',
    type: EdicaoResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Nenhuma edição encontrada' })
  async getUltima(): Promise<EdicaoResponseDto> {
    return this.edicaoService.getUltima();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar nova edição com upload de PDF e capa' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'pdf', maxCount: 1 },
        { name: 'capa', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: (req, file, cb) => {
            // Evita usar "this" dentro do closure para compatibilidade com compilação
            const isPdf = file.fieldname === 'pdf';
            const dest = isPdf
              ? join(process.cwd(), 'uploads/revista')
              : join(process.cwd(), 'uploads/revista/capas');
            if (!existsSync(dest)) {
              mkdirSync(dest, { recursive: true });
            }
            cb(null, dest);
          },
          filename: (req, file, cb) => {
            const uniqueSuffix =
              Date.now() + '-' + Math.round(Math.random() * 1e9);
            cb(
              null,
              `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`,
            );
          },
        }),
        fileFilter: (req, file, cb) => {
          // Validação rigorosa de tipos MIME e extensões
          const pdfTypes = ['application/pdf'];
          const imageTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp',
          ];

          // Validação por campo
          const allowed = file.fieldname === 'pdf' ? pdfTypes : imageTypes;

          // Verifica MIME type
          if (!allowed.includes(file.mimetype)) {
            cb(
              new BadRequestException(
                `Tipo de arquivo não permitido para ${file.fieldname}: ${file.mimetype}`,
              ),
              false,
            );
            return;
          }

          // Validação adicional de extensão para segurança
          const ext = file.originalname.toLowerCase().split('.').pop();
          const allowedExtensions =
            file.fieldname === 'pdf' ? ['pdf'] : ['jpg', 'jpeg', 'png', 'webp'];

          if (!ext || !allowedExtensions.includes(ext)) {
            cb(
              new BadRequestException(
                `Extensão de arquivo não permitida para ${file.fieldname}: .${ext}`,
              ),
              false,
            );
            return;
          }

          // Sanitização e validação de nome do arquivo
          const sanitizedName = EdicaoController.sanitizeFileName(
            file.originalname,
          );
          if (!sanitizedName || sanitizedName.length === 0) {
            cb(
              new BadRequestException(
                'Nome do arquivo inválido após sanitização',
              ),
              false,
            );
            return;
          }

          // Atualiza o nome do arquivo com a versão sanitizada
          file.originalname = sanitizedName;

          cb(null, true);
        },
        limits: {
          fileSize: 50 * 1024 * 1024, // 50MB máximo
          files: 2, // Máximo 2 arquivos (PDF + capa)
          fieldNameSize: 50, // Limite do nome do campo
          fieldSize: 1024 * 1024, // 1MB para campos de texto
        },
      },
    ),
  )
  @ApiBody({
    description: 'Dados da edição e arquivos',
    schema: {
      type: 'object',
      properties: {
        titulo: { type: 'string' },
        descricao: { type: 'string' },
        data: { type: 'string', format: 'date-time' },
        pdf: { type: 'string', format: 'binary' },
        capa: { type: 'string', format: 'binary' },
      },
      required: ['titulo', 'pdf'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Edição criada',
    type: EdicaoResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados/arquivos inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async create(
    @UploadedFiles()
    files: { pdf?: Express.Multer.File[]; capa?: Express.Multer.File[] },
    @Body() dto: CreateEdicaoDto,
  ): Promise<EdicaoResponseDto> {
    // Validação rigorosa do PDF
    const pdf = files?.pdf?.[0];
    if (!pdf) {
      throw new BadRequestException('Arquivo PDF é obrigatório');
    }

    if (pdf.mimetype !== 'application/pdf') {
      throw new BadRequestException('Arquivo deve ser um PDF válido');
    }

    if (pdf.size < 1024) {
      // Menor que 1KB é suspeito
      throw new BadRequestException(
        'Arquivo PDF muito pequeno, pode estar corrompido',
      );
    }

    if (pdf.size > 50 * 1024 * 1024) {
      // 50MB
      throw new BadRequestException('Arquivo PDF excede o limite de 50MB');
    }

    // Validação rigorosa da capa (se fornecida)
    const capa = files.capa?.[0];
    if (capa) {
      const allowedImageTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
      ];
      if (!allowedImageTypes.includes(capa.mimetype)) {
        throw new BadRequestException(
          'Arquivo de capa deve ser uma imagem válida (JPEG, PNG ou WebP)',
        );
      }

      if (capa.size < 100) {
        // Menor que 100 bytes é suspeito
        throw new BadRequestException(
          'Arquivo de capa muito pequeno, pode estar corrompido',
        );
      }

      if (capa.size > 5 * 1024 * 1024) {
        // 5MB
        throw new BadRequestException('Imagem de capa excede o limite de 5MB');
      }
    }

    // Validação adicional de segurança para o DTO
    if (dto.id && dto.id.includes('..')) {
      throw new BadRequestException('ID contém caracteres não permitidos');
    }

    return this.edicaoService.create(dto, files);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar edição com possibilidade de substituir PDF e capa' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'pdf', maxCount: 1 },
        { name: 'capa', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: (req, file, cb) => {
            const isPdf = file.fieldname === 'pdf';
            const dest = isPdf
              ? join(process.cwd(), 'uploads/revista')
              : join(process.cwd(), 'uploads/revista/capas');
            if (!existsSync(dest)) {
              mkdirSync(dest, { recursive: true });
            }
            cb(null, dest);
          },
          filename: (req, file, cb) => {
            const uniqueSuffix =
              Date.now() + '-' + Math.round(Math.random() * 1e9);
            cb(
              null,
              `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`,
            );
          },
        }),
        fileFilter: (req, file, cb) => {
          const pdfTypes = ['application/pdf'];
          const imageTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp',
          ];

          const allowed = file.fieldname === 'pdf' ? pdfTypes : imageTypes;
          if (!allowed.includes(file.mimetype)) {
            cb(
              new BadRequestException(
                `Tipo de arquivo não permitido para ${file.fieldname}: ${file.mimetype}`,
              ),
              false,
            );
            return;
          }

          const ext = file.originalname.toLowerCase().split('.').pop();
          const allowedExtensions =
            file.fieldname === 'pdf' ? ['pdf'] : ['jpg', 'jpeg', 'png', 'webp'];

          if (!ext || !allowedExtensions.includes(ext)) {
            cb(
              new BadRequestException(
                `Extensão de arquivo não permitida para ${file.fieldname}: .${ext}`,
              ),
              false,
            );
            return;
          }

          const sanitizedName = EdicaoController.sanitizeFileName(
            file.originalname,
          );
          if (!sanitizedName || sanitizedName.length === 0) {
            cb(
              new BadRequestException(
                'Nome do arquivo inválido após sanitização',
              ),
              false,
            );
            return;
          }

          file.originalname = sanitizedName;
          cb(null, true);
        },
        limits: {
          fileSize: 50 * 1024 * 1024,
          files: 2,
          fieldNameSize: 50,
          fieldSize: 1024 * 1024,
        },
      },
    ),
  )
  @ApiBody({
    description: 'Dados da edição e arquivos para atualização',
    schema: {
      type: 'object',
      properties: {
        titulo: { type: 'string' },
        descricao: { type: 'string' },
        data: { type: 'string', format: 'date-time' },
        pdf: { type: 'string', format: 'binary' },
        capa: { type: 'string', format: 'binary' },
      },
    },
  })
  async update(
    @Param('id') id: string,
    @UploadedFiles()
    files: { pdf?: Express.Multer.File[]; capa?: Express.Multer.File[] },
    @Body() dto: Partial<CreateEdicaoDto>,
  ): Promise<EdicaoResponseDto> {
    if (!id || id.includes('..')) {
      throw new BadRequestException('ID inválido');
    }
    return this.edicaoService.update(id, dto, files);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir edição (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID da edição a ser excluída' })
  @ApiResponse({
    status: 204,
    description: 'Edição excluída com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Edição não encontrada' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async delete(@Param('id') id: string): Promise<void> {
    // Validações de segurança para o ID
    if (!id || id.trim().length === 0) {
      throw new BadRequestException('ID da edição é obrigatório');
    }

    if (id.length > 50) {
      throw new BadRequestException('ID da edição muito longo');
    }

    if (id.includes('..') || id.includes('/') || id.includes('\\')) {
      throw new BadRequestException('ID contém caracteres não permitidos');
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
      throw new BadRequestException(
        'ID deve conter apenas letras, números, hífens e underscores',
      );
    }

    return this.edicaoService.delete(id.trim());
  }
}
