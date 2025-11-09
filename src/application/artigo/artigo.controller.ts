import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Req,
  Res,
  Ip,
  Headers,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as sharp from 'sharp';
import { promises as fs } from 'fs';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ArtigoService } from './artigo.service';
import { CreateArtigoDto } from './dto/create-artigo.dto';
import { UpdateArtigoDto } from './dto/update-artigo.dto';
import { CreateArtigoWithImageDto } from './dto/create-artigo-with-image.dto';
import { UpdateArtigoWithImageDto } from './dto/update-artigo-with-image.dto';
import { ListArtigosDto, ArtigosListResponseDto } from './dto/list-artigos.dto';
import { ArtigoResponseDto } from './dto/artigo-response.dto';
import { CreateComentarioDto } from './dto/create-comentario.dto';
import { UpdateComentarioDto } from './dto/update-comentario.dto';
import { ComentarioResponseDto } from './dto/comentario-response.dto';
import { ViewArtigoDto, ViewStatsResponseDto } from './dto/view-artigo.dto';
import {
  CurtirArtigoDto,
  ToggleCurtidaResponseDto,
} from './dto/curtir-artigo.dto';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { IsPublic } from '../../core/decorators/is-public.decorator';
import { Role } from '@prisma/client';
import { Request, Response } from 'express';

@ApiTags('Artigos')
@Controller('artigos')
export class ArtigoController {
  constructor(private readonly artigoService: ArtigoService) {}

  /**
   * Processa upload de imagem e retorna a URL
   */
  private async processImageUpload(
    file?: Express.Multer.File,
  ): Promise<string | null> {
    if (!file) {
      return null;
    }

    try {
      // Gerar nome único para o arquivo AVIF
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const avifFilename = `artigo-${uniqueSuffix}.avif`;
      const avifPath = join(process.cwd(), 'uploads', 'artigos', avifFilename);

      // Converter imagem para AVIF usando Sharp
      await sharp(file.path)
        .avif({
          quality: 80,
          effort: 7,
        })
        .toFile(avifPath);

      // Remover arquivo original após conversão
      await fs.unlink(file.path);

      return `/uploads/artigos/${avifFilename}`;
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      throw new BadRequestException('Erro ao processar a imagem');
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor('imagemCapa', {
      storage: diskStorage({
        destination: './uploads/artigos',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `temp-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return callback(
            new BadRequestException('Apenas imagens são permitidas'),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Criar novo artigo com upload de imagem' })
  @ApiBody({
    description: 'Dados do artigo e imagem de capa',
    schema: {
      type: 'object',
      properties: {
        titulo: { type: 'string' },
        conteudo: { type: 'string' },
        resumo: { type: 'string' },
        autorId: { type: 'string' },
        categoria: { type: 'string' },
        status: { type: 'string' },
        dataPublicacao: { type: 'string' },
        destaque: { type: 'boolean' },
        tags: { type: 'array', items: { type: 'string' } },
        imagemCapa: { type: 'string', format: 'binary' },
      },
      required: [
        'titulo',
        'conteudo',
        'autorId',
        'categoria',
        'dataPublicacao',
      ],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Artigo criado com sucesso',
    type: ArtigoResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async create(
    @Body() createArtigoDto: CreateArtigoWithImageDto,
    @UploadedFile() imagemCapa?: Express.Multer.File,
  ): Promise<ArtigoResponseDto> {
    // Processar upload da imagem se fornecida
    const imagemCapaUrl = await this.processImageUpload(imagemCapa);

    // Converter conteúdo de string para objeto JSON
    let conteudoJson;
    try {
      conteudoJson =
        typeof createArtigoDto.conteudo === 'string'
          ? JSON.parse(createArtigoDto.conteudo)
          : createArtigoDto.conteudo;
    } catch (error) {
      throw new BadRequestException('Conteúdo deve ser um JSON válido');
    }

    // Criar DTO para o serviço
    const artigoData: CreateArtigoDto = {
      ...createArtigoDto,
      conteudo: conteudoJson,
      imagemCapa: imagemCapaUrl || undefined,
    };

    return this.artigoService.create(artigoData);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os artigos (admin/editor)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de artigos retornada com sucesso',
    type: ArtigosListResponseDto,
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @ApiBearerAuth()
  async findAll(
    @Query() listArtigosDto: ListArtigosDto,
  ): Promise<ArtigosListResponseDto> {
    return this.artigoService.findAll(listArtigosDto);
  }

  @Get('publicados')
  @IsPublic()
  @ApiOperation({ summary: 'Listar artigos publicados (público)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de artigos publicados retornada com sucesso',
    type: ArtigosListResponseDto,
  })
  async findPublicados(
    @Query() listArtigosDto: ListArtigosDto,
  ): Promise<ArtigosListResponseDto> {
    return this.artigoService.findPublicados(listArtigosDto);
  }

  @Get('artigos-homepage')
  @IsPublic()
  @ApiOperation({ summary: 'Listar artigos para homepage (público)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Número máximo de artigos (padrão: 9)',
    example: 9,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de artigos para homepage retornada com sucesso',
    type: [ArtigoResponseDto],
  })
  async findArtigosHomepage(
    @Query('limit') limit?: string,
  ): Promise<ArtigoResponseDto[]> {
    const limitNumber = limit ? parseInt(limit) : 9;
    return this.artigoService.findDestaques(limitNumber);
  }

  @Get('destaques')
  @IsPublic()
  @ApiOperation({
    summary:
      'Listar artigos em destaque (público) - DEPRECATED: use /artigos-homepage',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Número máximo de artigos (padrão: 5)',
    example: 5,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de artigos em destaque retornada com sucesso',
    type: [ArtigoResponseDto],
  })
  async findDestaques(
    @Query('limit') limit?: string,
  ): Promise<ArtigoResponseDto[]> {
    const limitNumber = limit ? parseInt(limit) : 5;
    return this.artigoService.findDestaques(limitNumber);
  }

  @IsPublic()
  @Get('imagem/:filename')
  async seeUploadedFile(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    try {
      const filePath = join(process.cwd(), 'uploads', 'artigos', filename);
      await fs.access(filePath);

      // Define Content-Type explicitamente para evitar bloqueios/ORB em navegadores
      const ext = extname(filename).toLowerCase();
      const mimeMap: Record<string, string> = {
        '.avif': 'image/avif',
        '.webp': 'image/webp',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
      };
      const contentType = mimeMap[ext] || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);

      return res.sendFile(filename, { root: 'uploads/artigos' });
    } catch (err) {
      return res
        .status(404)
        .json({ message: 'Imagem não encontrada', filename });
    }
  }

  @Get(':id')
  @IsPublic()
  @ApiOperation({ summary: 'Obter artigo por ID' })
  @ApiParam({ name: 'id', description: 'ID do artigo' })
  @ApiQuery({
    name: 'incrementView',
    required: false,
    description: 'Incrementar visualizações (padrão: false)',
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Artigo retornado com sucesso',
    type: ArtigoResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Artigo não encontrado' })
  async findOne(
    @Param('id') id: string,
    @Query('incrementView') incrementView?: string,
  ): Promise<ArtigoResponseDto> {
    const shouldIncrementView = incrementView === 'true';
    return this.artigoService.findOne(id, shouldIncrementView);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor('imagemCapa', {
      storage: diskStorage({
        destination: './uploads/artigos',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `temp-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return callback(
            new BadRequestException('Apenas imagens são permitidas'),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Atualizar artigo com upload de imagem' })
  @ApiParam({ name: 'id', description: 'ID do artigo' })
  @ApiBody({
    description: 'Dados do artigo e imagem de capa (todos opcionais)',
    schema: {
      type: 'object',
      properties: {
        titulo: { type: 'string' },
        conteudo: { type: 'string' },
        resumo: { type: 'string' },
        autorId: { type: 'string' },
        categoria: { type: 'string' },
        status: { type: 'string' },
        dataPublicacao: { type: 'string' },
        destaque: { type: 'boolean' },
        tags: { type: 'array', items: { type: 'string' } },
        imagemCapa: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Artigo atualizado com sucesso',
    type: ArtigoResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Artigo não encontrado' })
  async update(
    @Param('id') id: string,
    @Body() updateArtigoDto: UpdateArtigoWithImageDto,
    @UploadedFile() imagemCapa?: Express.Multer.File,
  ): Promise<ArtigoResponseDto> {
    // Processar upload da imagem se fornecida
    const imagemCapaUrl = await this.processImageUpload(imagemCapa);

    // Converter conteúdo de string para objeto JSON se fornecido
    let conteudoJson;
    if (updateArtigoDto.conteudo) {
      try {
        conteudoJson =
          typeof updateArtigoDto.conteudo === 'string'
            ? JSON.parse(updateArtigoDto.conteudo)
            : updateArtigoDto.conteudo;
      } catch (error) {
        throw new BadRequestException('Conteúdo deve ser um JSON válido');
      }
    }

    // Criar DTO para o serviço
    const artigoData: UpdateArtigoDto = {
      ...updateArtigoDto,
      ...(conteudoJson && { conteudo: conteudoJson }),
      ...(imagemCapaUrl && { imagemCapa: imagemCapaUrl }),
    };

    return this.artigoService.update(id, artigoData);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Excluir artigo' })
  @ApiParam({ name: 'id', description: 'ID do artigo' })
  @ApiResponse({ status: 200, description: 'Artigo excluído com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Artigo não encontrado' })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.artigoService.remove(id);
    return { message: 'Artigo excluído com sucesso' };
  }

  @Post(':id/view')
  @IsPublic()
  @ApiOperation({ summary: 'Registrar visualização de artigo' })
  @ApiParam({ name: 'id', description: 'ID do artigo' })
  @ApiResponse({
    status: 200,
    description: 'Visualização registrada',
    type: ViewStatsResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Artigo não encontrado' })
  async registrarVisualizacao(
    @Param('id') id: string,
    @Body() viewData: ViewArtigoDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<ViewStatsResponseDto> {
    return this.artigoService.registrarVisualizacao(id, {
      ...viewData,
      ip,
      userAgent,
    });
  }

  @Get(':id/view/check')
  @IsPublic()
  @ApiOperation({ summary: 'Verificar se já visualizou o artigo' })
  @ApiParam({ name: 'id', description: 'ID do artigo' })
  @ApiQuery({ name: 'fingerprint', description: 'Fingerprint do dispositivo' })
  @ApiResponse({
    status: 200,
    description: 'Status de visualização',
    schema: {
      type: 'object',
      properties: {
        visualizado: { type: 'boolean' },
      },
    },
  })
  async verificarVisualizacao(
    @Param('id') id: string,
    @Query('fingerprint') fingerprint: string,
  ): Promise<{ visualizado: boolean }> {
    const visualizado = await this.artigoService.verificarVisualizacao(
      id,
      fingerprint,
    );
    return { visualizado };
  }

  @Post(':id/curtida/toggle')
  @IsPublic()
  @ApiOperation({
    summary: 'Toggle curtida em artigo (adiciona ou remove)',
  })
  @ApiParam({ name: 'id', description: 'ID do artigo' })
  @ApiResponse({
    status: 200,
    description: 'Curtida atualizada com sucesso',
    type: ToggleCurtidaResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Artigo não encontrado' })
  async toggleCurtida(
    @Param('id') id: string,
    @Body() curtidaData: CurtirArtigoDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<ToggleCurtidaResponseDto> {
    return this.artigoService.toggleCurtida(id, {
      ...curtidaData,
      ip,
      userAgent,
    });
  }

  @Get(':id/curtida/check')
  @IsPublic()
  @ApiOperation({ summary: 'Verificar se já curtiu o artigo' })
  @ApiParam({ name: 'id', description: 'ID do artigo' })
  @ApiQuery({ name: 'fingerprint', description: 'Fingerprint do dispositivo' })
  @ApiResponse({
    status: 200,
    description: 'Status de curtida',
    schema: {
      type: 'object',
      properties: {
        curtido: { type: 'boolean' },
      },
    },
  })
  async verificarCurtida(
    @Param('id') id: string,
    @Query('fingerprint') fingerprint: string,
  ): Promise<{ curtido: boolean }> {
    const curtido = await this.artigoService.verificarCurtida(id, fingerprint);
    return { curtido };
  }

  @Get(':id/stats/curtidas')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter estatísticas de curtidas do artigo' })
  @ApiParam({ name: 'id', description: 'ID do artigo' })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Número de dias para estatísticas (padrão: 30)',
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas de curtidas',
  })
  async obterEstatisticasCurtidas(
    @Param('id') id: string,
    @Query('days') days?: string,
  ) {
    const daysNumber = days ? parseInt(days) : 30;
    return this.artigoService.obterEstatisticasCurtidas(id, daysNumber);
  }

  @Get(':id/stats/views')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter estatísticas de visualizações do artigo' })
  @ApiParam({ name: 'id', description: 'ID do artigo' })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Número de dias para estatísticas (padrão: 30)',
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas de visualizações',
  })
  async obterEstatisticasVisualizacoes(
    @Param('id') id: string,
    @Query('days') days?: string,
  ) {
    const daysNumber = days ? parseInt(days) : 30;
    return this.artigoService.obterEstatisticasVisualizacoes(id, daysNumber);
  }

  // --- Endpoints legados (manter compatibilidade) ---

  @Post(':id/curtir')
  @ApiOperation({ summary: 'Curtir artigo (DEPRECATED: use /curtida/toggle)' })
  @ApiParam({ name: 'id', description: 'ID do artigo' })
  @ApiResponse({
    status: 200,
    description: 'Artigo curtido com sucesso',
    type: ArtigoResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Artigo não encontrado' })
  async curtir(@Param('id') id: string): Promise<ArtigoResponseDto> {
    return this.artigoService.curtir(id);
  }

  @Post(':id/descurtir')
  @ApiOperation({
    summary: 'Descurtir artigo (DEPRECATED: use /curtida/toggle)',
  })
  @ApiParam({ name: 'id', description: 'ID do artigo' })
  @ApiResponse({
    status: 200,
    description: 'Artigo descurtido com sucesso',
    type: ArtigoResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Artigo não encontrado' })
  async descurtir(@Param('id') id: string): Promise<ArtigoResponseDto> {
    return this.artigoService.descurtir(id);
  }

  // --- Comentários ---

  @Get(':id/comentarios')
  @ApiOperation({ summary: 'Listar comentários de um artigo' })
  @ApiParam({ name: 'id', description: 'ID do artigo' })
  @ApiResponse({
    status: 200,
    description: 'Lista de comentários',
    type: [ComentarioResponseDto],
  })
  async findComentarios(
    @Param('id') id: string,
  ): Promise<ComentarioResponseDto[]> {
    return this.artigoService.findComentariosByArtigoId(id);
  }

  @Post(':id/comentarios')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Adicionar um novo comentário' })
  @ApiParam({ name: 'id', description: 'ID do artigo' })
  @ApiResponse({
    status: 201,
    description: 'Comentário criado com sucesso',
    type: ComentarioResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async addComentario(
    @Param('id') artigoId: string,
    @Body() createComentarioDto: CreateComentarioDto,
    @Req() req: Request & { user: { userId: string } },
  ): Promise<ComentarioResponseDto> {
    const autorId = req.user.userId; // Extraído do token JWT
    return this.artigoService.addComentario(artigoId, {
      ...createComentarioDto,
      autorId,
    });
  }

  @Patch('comentarios/:comentarioId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar um comentário' })
  @ApiParam({ name: 'comentarioId', description: 'ID do comentário' })
  @ApiResponse({
    status: 200,
    description: 'Comentário atualizado com sucesso',
    type: ComentarioResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Comentário não encontrado' })
  async updateComentario(
    @Param('comentarioId') comentarioId: string,
    @Body() updateComentarioDto: UpdateComentarioDto,
    @Req() req: Request & { user: { userId: string } },
  ): Promise<ComentarioResponseDto> {
    const autorId = req.user.userId;
    return this.artigoService.updateComentario(
      comentarioId,
      autorId,
      updateComentarioDto,
    );
  }

  @Delete('comentarios/:comentarioId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Excluir um comentário' })
  @ApiParam({ name: 'comentarioId', description: 'ID do comentário' })
  @ApiResponse({ status: 204, description: 'Comentário excluído com sucesso' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Comentário não encontrado' })
  async deleteComentario(
    @Param('comentarioId') comentarioId: string,
    @Req() req: Request & { user: { userId: string } },
  ): Promise<void> {
    const autorId = req.user.userId;
    return this.artigoService.deleteComentario(comentarioId, autorId);
  }
}
