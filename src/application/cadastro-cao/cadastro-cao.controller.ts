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
  Request,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { CadastroCaoService } from './cadastro-cao.service';
import { CreateCadastroCaoDto } from './dto/create-cadastro-cao.dto';
import { UpdateCadastroCaoDto } from './dto/update-cadastro-cao.dto';
import {
  ListCadastrosCaoDto,
  CadastrosCaoListResponseDto,
} from './dto/list-cadastros-cao.dto';
import { CadastroCaoResponseDto } from './dto/cadastro-cao-response.dto';
import { FileUploadService } from '../../core/services/file-upload.service';

@ApiTags('Cadastro de Cães')
@Controller('cadastro-cao')
export class CadastroCaoController {
  constructor(
    private readonly cadastroCaoService: CadastroCaoService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar novo cadastro de cão' })
  @ApiResponse({
    status: 201,
    description: 'Cadastro criado com sucesso',
    type: CadastroCaoResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async create(
    @Request() req,
    @Body() createCadastroCaoDto: CreateCadastroCaoDto,
  ): Promise<CadastroCaoResponseDto> {
    return this.cadastroCaoService.create(req.user.userId, createCadastroCaoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar cadastros de cães com filtros e paginação' })
  @ApiResponse({
    status: 200,
    description: 'Lista de cadastros retornada com sucesso',
    type: CadastrosCaoListResponseDto,
  })
  @ApiQuery({ name: 'page', required: false, description: 'Número da página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Itens por página (padrão: 10, máx: 50)' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por nome do cão ou proprietário' })
  @ApiQuery({ name: 'raca', required: false, description: 'Filtrar por raça' })
  @ApiQuery({ name: 'sexo', required: false, description: 'Filtrar por sexo' })
  @ApiQuery({ name: 'cidade', required: false, description: 'Filtrar por cidade' })
  @ApiQuery({ name: 'estado', required: false, description: 'Filtrar por estado' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Campo para ordenação' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Ordem: asc ou desc' })
  async findAll(@Query() query: ListCadastrosCaoDto): Promise<CadastrosCaoListResponseDto> {
    return this.cadastroCaoService.findAll(query);
  }

  @Get('/meus-cadastros')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar cadastros do usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Lista de cadastros retornada com sucesso', type: [CadastroCaoResponseDto] })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async findByUser(@Request() req: any): Promise<CadastroCaoResponseDto[]> {
    return this.cadastroCaoService.findByUser(req.user.userId);
  }

  @Get('raca/:raca')
  @ApiOperation({ summary: 'Buscar cães por raça' })
  @ApiResponse({
    status: 200,
    description: 'Lista de cães da raça especificada',
    type: [CadastroCaoResponseDto],
  })
  @ApiQuery({ name: 'limit', required: false, description: 'Limite de resultados (padrão: 10)' })
  async findByRaca(
    @Param('raca') raca: string,
    @Query('limit') limit?: string,
  ): Promise<CadastroCaoResponseDto[]> {
    const limitNumber = limit ? parseInt(limit) : 10;
    return this.cadastroCaoService.findByRaca(raca, limitNumber);
  }

  @Get('sexo/:sexo')
  @ApiOperation({ summary: 'Buscar cães por sexo' })
  @ApiResponse({
    status: 200,
    description: 'Lista de cães do sexo especificado',
    type: [CadastroCaoResponseDto],
  })
  @ApiQuery({ name: 'limit', required: false, description: 'Limite de resultados (padrão: 10)' })
  async findBySexo(
    @Param('sexo') sexo: string,
    @Query('limit') limit?: string,
  ): Promise<CadastroCaoResponseDto[]> {
    const limitNumber = limit ? parseInt(limit) : 10;
    return this.cadastroCaoService.findBySexo(sexo, limitNumber);
  }

  @Get('com-pedigree')
  @ApiOperation({ summary: 'Buscar cães com pedigree' })
  @ApiResponse({
    status: 200,
    description: 'Lista de cães com pedigree',
    type: [CadastroCaoResponseDto],
  })
  async findComPedigree(): Promise<CadastroCaoResponseDto[]> {
    return this.cadastroCaoService.findComPedigree();
  }

  @Get('com-microchip')
  @ApiOperation({ summary: 'Buscar cães com microchip' })
  @ApiResponse({
    status: 200,
    description: 'Lista de cães com microchip',
    type: [CadastroCaoResponseDto],
  })
  async findComMicrochip(): Promise<CadastroCaoResponseDto[]> {
    return this.cadastroCaoService.findComMicrochip();
  }

  @Get('com-video')
  @ApiOperation({ summary: 'Buscar cães com vídeo' })
  @ApiResponse({
    status: 200,
    description: 'Lista de cães com vídeo',
    type: [CadastroCaoResponseDto],
  })
  async findComVideo(): Promise<CadastroCaoResponseDto[]> {
    return this.cadastroCaoService.findComVideo();
  }

  @Get('recentes')
  @ApiOperation({ summary: 'Buscar cadastros recentes' })
  @ApiResponse({
    status: 200,
    description: 'Lista de cadastros recentes',
    type: [CadastroCaoResponseDto],
  })
  @ApiQuery({ name: 'limit', required: false, description: 'Limite de resultados (padrão: 5)' })
  async findRecentCadastros(@Query('limit') limit?: string): Promise<CadastroCaoResponseDto[]> {
    const limitNumber = limit ? parseInt(limit) : 5;
    return this.cadastroCaoService.findRecentCadastros(limitNumber);
  }

  @Get('usuario/:userId/count')
  @ApiOperation({ summary: 'Contar cadastros de um usuário' })
  @ApiResponse({
    status: 200,
    description: 'Número de cadastros do usuário',
    schema: { type: 'object', properties: { count: { type: 'number' } } },
  })
  async getUserCadastrosCount(@Param('userId') userId: string): Promise<{ count: number }> {
    const count = await this.cadastroCaoService.getUserCadastrosCount(userId);
    return { count };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar cadastro por ID' })
  @ApiResponse({
    status: 200,
    description: 'Cadastro encontrado',
    type: CadastroCaoResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Cadastro não encontrado' })
  async findOne(@Param('id') id: string): Promise<CadastroCaoResponseDto> {
    return this.cadastroCaoService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar cadastro de cão' })
  @ApiResponse({
    status: 200,
    description: 'Cadastro atualizado com sucesso',
    type: CadastroCaoResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Sem permissão para editar este cadastro' })
  @ApiResponse({ status: 404, description: 'Cadastro não encontrado' })
  async update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateCadastroCaoDto: UpdateCadastroCaoDto,
  ): Promise<CadastroCaoResponseDto> {
    return this.cadastroCaoService.update(id, req.user.userId, updateCadastroCaoDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Excluir cadastro de cão' })
  @ApiResponse({ status: 200, description: 'Cadastro excluído com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Sem permissão para excluir este cadastro' })
  @ApiResponse({ status: 404, description: 'Cadastro não encontrado' })
  async remove(@Param('id') id: string, @Request() req): Promise<{ message: string }> {
    await this.cadastroCaoService.remove(id, req.user.userId);
    return { message: 'Cadastro excluído com sucesso' };
  }

  @Post('upload-fotos')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload de fotos para cadastro de cão' })
  @ApiBody({
    description: 'Arquivos de imagem (máximo 10)',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Fotos enviadas com sucesso',
    schema: {
      type: 'object',
      properties: {
        urls: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Arquivos inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async uploadFotos(@UploadedFiles() files: Express.Multer.File[]): Promise<{ urls: string[] }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    if (files.length > 10) {
      throw new BadRequestException('Máximo de 10 arquivos permitidos');
    }

    const urls: string[] = [];
    
    for (const file of files) {
      const result = await this.fileUploadService.processUploadedFile(file, 'dogProfile');
      urls.push(result.url);
    }

    return { urls };
  }

  @Post('upload-pedigree')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FilesInterceptor('files', 2))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload de arquivos de pedigree (frente e verso)' })
  @ApiBody({
    description: 'Arquivos de pedigree (frente e verso)',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          maxItems: 2,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Arquivos de pedigree enviados com sucesso',
    schema: {
      type: 'object',
      properties: {
        urls: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Arquivos inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async uploadPedigree(@UploadedFiles() files: Express.Multer.File[]): Promise<{ urls: string[] }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    if (files.length > 2) {
      throw new BadRequestException('Máximo de 2 arquivos permitidos (frente e verso)');
    }

    const urls: string[] = [];
    
    for (const file of files) {
      const result = await this.fileUploadService.processUploadedFile(file, 'dogPedigree');
       urls.push(result.url);
    }

    return { urls };
  }
}