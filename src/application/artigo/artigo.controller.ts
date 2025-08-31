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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
import { ListArtigosDto, ArtigosListResponseDto } from './dto/list-artigos.dto';
import { ArtigoResponseDto } from './dto/artigo-response.dto';
import { CreateComentarioDto } from './dto/create-comentario.dto';
import { UpdateComentarioDto } from './dto/update-comentario.dto';
import { ComentarioResponseDto } from './dto/comentario-response.dto';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { FileUploadService } from '../../core/services/file-upload.service';

@ApiTags('Artigos')
@Controller('artigos')
export class ArtigoController {
  constructor(
    private readonly artigoService: ArtigoService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar novo artigo' })
  @ApiResponse({ status: 201, description: 'Artigo criado com sucesso', type: ArtigoResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async create(@Body() createArtigoDto: CreateArtigoDto): Promise<ArtigoResponseDto> {
    return this.artigoService.create(createArtigoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os artigos (admin/editor)' })
  @ApiResponse({ status: 200, description: 'Lista de artigos retornada com sucesso', type: ArtigosListResponseDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @ApiBearerAuth()
  async findAll(@Query() listArtigosDto: ListArtigosDto): Promise<ArtigosListResponseDto> {
    return this.artigoService.findAll(listArtigosDto);
  }

  @Get('publicados')
  @ApiOperation({ summary: 'Listar artigos publicados (público)' })
  @ApiResponse({ status: 200, description: 'Lista de artigos publicados retornada com sucesso', type: ArtigosListResponseDto })
  async findPublicados(@Query() listArtigosDto: ListArtigosDto): Promise<ArtigosListResponseDto> {
    return this.artigoService.findPublicados(listArtigosDto);
  }

  @Get('destaques')
  @ApiOperation({ summary: 'Listar artigos em destaque (público)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Número máximo de artigos (padrão: 5)', example: 5 })
  @ApiResponse({ status: 200, description: 'Lista de artigos em destaque retornada com sucesso', type: [ArtigoResponseDto] })
  async findDestaques(@Query('limit') limit?: string): Promise<ArtigoResponseDto[]> {
    const limitNumber = limit ? parseInt(limit) : 5;
    return this.artigoService.findDestaques(limitNumber);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter artigo por ID' })
  @ApiParam({ name: 'id', description: 'ID do artigo' })
  @ApiQuery({ name: 'incrementView', required: false, description: 'Incrementar visualizações (padrão: false)', example: false })
  @ApiResponse({ status: 200, description: 'Artigo retornado com sucesso', type: ArtigoResponseDto })
  @ApiResponse({ status: 404, description: 'Artigo não encontrado' })
  async findOne(@Param('id') id: string, @Query('incrementView') incrementView?: string): Promise<ArtigoResponseDto> {
    const shouldIncrementView = incrementView === 'true';
    return this.artigoService.findOne(id, shouldIncrementView);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar artigo' })
  @ApiParam({ name: 'id', description: 'ID do artigo' })
  @ApiResponse({ status: 200, description: 'Artigo atualizado com sucesso', type: ArtigoResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Artigo não encontrado' })
  async update(@Param('id') id: string, @Body() updateArtigoDto: UpdateArtigoDto): Promise<ArtigoResponseDto> {
    return this.artigoService.update(id, updateArtigoDto);
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

  @Post(':id/curtir')
  @ApiOperation({ summary: 'Curtir artigo' })
  @ApiParam({ name: 'id', description: 'ID do artigo' })
  @ApiResponse({ status: 200, description: 'Artigo curtido com sucesso', type: ArtigoResponseDto })
  @ApiResponse({ status: 404, description: 'Artigo não encontrado' })
  async curtir(@Param('id') id: string): Promise<ArtigoResponseDto> {
    return this.artigoService.curtir(id);
  }

  @Post(':id/descurtir')
  @ApiOperation({ summary: 'Descurtir artigo' })
  @ApiParam({ name: 'id', description: 'ID do artigo' })
  @ApiResponse({ status: 200, description: 'Artigo descurtido com sucesso', type: ArtigoResponseDto })
  @ApiResponse({ status: 404, description: 'Artigo não encontrado' })
  async descurtir(@Param('id') id: string): Promise<ArtigoResponseDto> {
    return this.artigoService.descurtir(id);
  }

  @Post('imagens/upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload de imagem para artigo' })
  @ApiBody({ description: 'Arquivo de imagem', schema: { type: 'object', properties: { image: { type: 'string', format: 'binary' } } } })
  @ApiResponse({ status: 200, description: 'Imagem enviada com sucesso', schema: { type: 'object', properties: { url: { type: 'string' } } } })
  @ApiResponse({ status: 400, description: 'Arquivo inválido' })
  async uploadImagem(@UploadedFile() file: Express.Multer.File): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }
    const processedFile = await this.fileUploadService.processUploadedFile(file, 'articleImage');
    return { url: processedFile.url };
  }

  // --- Comentários ---

  @Get(':id/comentarios')
  @ApiOperation({ summary: 'Listar comentários de um artigo' })
  @ApiParam({ name: 'id', description: 'ID do artigo' })
  @ApiResponse({ status: 200, description: 'Lista de comentários', type: [ComentarioResponseDto] })
  async findComentarios(@Param('id') id: string): Promise<ComentarioResponseDto[]> {
    return this.artigoService.findComentariosByArtigoId(id);
  }

  @Post(':id/comentarios')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Adicionar um novo comentário' })
  @ApiParam({ name: 'id', description: 'ID do artigo' })
  @ApiResponse({ status: 201, description: 'Comentário criado com sucesso', type: ComentarioResponseDto })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async addComentario(
    @Param('id') artigoId: string,
    @Body() createComentarioDto: CreateComentarioDto,
    @Req() req: any,
  ): Promise<ComentarioResponseDto> {
    const autorId = req.user.userId; // Extraído do token JWT
    return this.artigoService.addComentario(artigoId, { ...createComentarioDto, autorId });
  }

  @Patch('comentarios/:comentarioId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar um comentário' })
  @ApiParam({ name: 'comentarioId', description: 'ID do comentário' })
  @ApiResponse({ status: 200, description: 'Comentário atualizado com sucesso', type: ComentarioResponseDto })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Comentário não encontrado' })
  async updateComentario(
    @Param('comentarioId') comentarioId: string,
    @Body() updateComentarioDto: UpdateComentarioDto,
    @Req() req: any,
  ): Promise<ComentarioResponseDto> {
    const autorId = req.user.userId;
    return this.artigoService.updateComentario(comentarioId, autorId, updateComentarioDto);
  }

  @Delete('comentarios/:comentarioId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Excluir um comentário' })
  @ApiParam({ name: 'comentarioId', description: 'ID do comentário' })
  @ApiResponse({ status: 204, description: 'Comentário excluído com sucesso' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Comentário não encontrado' })
  async deleteComentario(@Param('comentarioId') comentarioId: string, @Req() req: any): Promise<void> {
    const autorId = req.user.userId;
    return this.artigoService.deleteComentario(comentarioId, autorId);
  }
}
