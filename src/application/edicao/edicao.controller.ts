import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
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
          // Validação de tipos permitidos sem depender do FileUploadService
          const allowed =
            file.fieldname === 'pdf'
              ? ['application/pdf']
              : ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
          if (allowed.includes(file.mimetype)) {
            cb(null, true);
          } else {
            cb(
              new BadRequestException(
                `Arquivo inválido para campo ${file.fieldname}`,
              ),
              false,
            );
          }
        },
        limits: {
          fileSize: 50 * 1024 * 1024, // máximo entre os tipos, validaremos capa adicionalmente
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
      required: ['titulo', 'descricao', 'pdf'],
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
    const pdf = files?.pdf?.[0];
    if (!pdf || pdf.mimetype !== 'application/pdf') {
      throw new BadRequestException('Arquivo PDF inválido');
    }
    const capa = files.capa?.[0];
    if (
      capa &&
      !['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(
        capa.mimetype,
      )
    ) {
      throw new BadRequestException('Arquivo de capa inválido');
    }
    if (capa && capa.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Imagem de capa excede 5MB');
    }

    return this.edicaoService.create(dto, files);
  }
}
