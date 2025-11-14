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
  UploadedFile,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import { dogVideoMulterConfig } from '../../core/config/dog-video.multer.config';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
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
import {
  AprovarCadastroDto,
  AcaoCadastro,
  AprovarCadastroResponseDto,
} from './dto/aprovar-cadastro.dto';
import { FileUploadService } from '../../core/services/file-upload.service';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { IsPublic } from '../../core/decorators/is-public.decorator';

@ApiTags('Cadastro de Cães')
@Controller('cadastro-cao')
export class CadastroCaoController {
  private readonly logger = new Logger(CadastroCaoController.name);
  constructor(
    private readonly cadastroCaoService: CadastroCaoService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar novo cadastro de cÃ£o' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'fotoPerfil', maxCount: 1 },
      { name: 'fotoLateral', maxCount: 1 },
      { name: 'pedigreeFrente', maxCount: 1 },
      { name: 'pedigreeVerso', maxCount: 1 },
    ]),
  )
  @ApiResponse({
    status: 201,
    description: 'Cadastro criado com sucesso',
    type: CadastroCaoResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados invÃ¡lidos' })
  @ApiResponse({ status: 401, description: 'NÃ£o autorizado' })
  async create(
    @Request() req,
    @UploadedFiles()
    files: {
      fotoPerfil?: Express.Multer.File[];
      fotoLateral?: Express.Multer.File[];
      pedigreeFrente?: Express.Multer.File[];
      pedigreeVerso?: Express.Multer.File[];
    },
  ): Promise<CadastroCaoResponseDto> {
    this.logger.log(`Content-Type: ${req.headers['content-type']}`);
    const createCadastroCaoDto: CreateCadastroCaoDto = req.body;
    return this.cadastroCaoService.create(
      req.user.userId,
      createCadastroCaoDto,
      files.fotoPerfil?.[0],
      files.fotoLateral?.[0],
      files.pedigreeFrente?.[0],
      files.pedigreeVerso?.[0],
    );
  }

  @Post(':id/video/upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enviar arquivo de vÃ­deo do cadastro' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('video', dogVideoMulterConfig))
  @ApiResponse({
    status: 200,
    description: 'VÃ­deo anexado com sucesso',
    type: CadastroCaoResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados invÃ¡lidos' })
  @ApiResponse({ status: 401, description: 'NÃ£o autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Sem permissÃ£o para editar este cadastro',
  })
  @ApiResponse({ status: 404, description: 'Cadastro nÃ£o encontrado' })
  async uploadVideo(
    @Param('id') id: string,
    @Request() req,
    @UploadedFile() video?: Express.Multer.File,
  ): Promise<CadastroCaoResponseDto> {
    const isAdmin = [Role.ADMIN, Role.EDITOR, Role.FUNCIONARIO].includes(
      req.user.role,
    );
    return this.cadastroCaoService.updateVideoByUpload(
      id,
      req.user.userId,
      video,
      isAdmin,
    );
  }

  @Patch(':id/foto-perfil')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('fotoPerfil'))
  async updateFotoPerfil(
    @Param('id') id: string,
    @Request() req,
    @UploadedFile() foto?: Express.Multer.File,
  ): Promise<CadastroCaoResponseDto> {
    if (!foto) throw new BadRequestException('Arquivo obrigatório');
    const isAdmin = [Role.ADMIN, Role.EDITOR, Role.FUNCIONARIO].includes(
      req.user.role,
    );
    return this.cadastroCaoService.updateFotoPerfil(
      id,
      req.user.userId,
      foto,
      isAdmin,
    );
  }

  @Patch(':id/foto-lateral')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('fotoLateral'))
  async updateFotoLateral(
    @Param('id') id: string,
    @Request() req,
    @UploadedFile() foto?: Express.Multer.File,
  ): Promise<CadastroCaoResponseDto> {
    if (!foto) throw new BadRequestException('Arquivo obrigatório');
    const isAdmin = [Role.ADMIN, Role.EDITOR, Role.FUNCIONARIO].includes(
      req.user.role,
    );
    return this.cadastroCaoService.updateFotoLateral(
      id,
      req.user.userId,
      foto,
      isAdmin,
    );
  }

  @Patch(':id/pedigree/frente')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('pedigreeFrente'))
  async updatePedigreeFrente(
    @Param('id') id: string,
    @Request() req,
    @UploadedFile() arquivo?: Express.Multer.File,
  ): Promise<CadastroCaoResponseDto> {
    if (!arquivo) throw new BadRequestException('Arquivo obrigatório');
    const isAdmin = [Role.ADMIN, Role.EDITOR, Role.FUNCIONARIO].includes(
      req.user.role,
    );
    return this.cadastroCaoService.updatePedigreeFrente(
      id,
      req.user.userId,
      arquivo,
      isAdmin,
    );
  }

  @Patch(':id/pedigree/verso')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('pedigreeVerso'))
  async updatePedigreeVerso(
    @Param('id') id: string,
    @Request() req,
    @UploadedFile() arquivo?: Express.Multer.File,
  ): Promise<CadastroCaoResponseDto> {
    if (!arquivo) throw new BadRequestException('Arquivo obrigatório');
    const isAdmin = [Role.ADMIN, Role.EDITOR, Role.FUNCIONARIO].includes(
      req.user.role,
    );
    return this.cadastroCaoService.updatePedigreeVerso(
      id,
      req.user.userId,
      arquivo,
      isAdmin,
    );
  }

  @Get()
  @IsPublic()
  @ApiOperation({
    summary: 'Listar cadastros de cÃ£es com filtros e paginaÃ§Ã£o',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de cadastros retornada com sucesso',
    type: CadastrosCaoListResponseDto,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'NÃºmero da pÃ¡gina (padrÃ£o: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Itens por pÃ¡gina (padrÃ£o: 10, mÃ¡x: 50)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Buscar por nome do cÃ£o ou proprietÃ¡rio',
  })
  @ApiQuery({ name: 'raca', required: false, description: 'Filtrar por raÃ§a' })
  @ApiQuery({ name: 'sexo', required: false, description: 'Filtrar por sexo' })
  @ApiQuery({
    name: 'cidade',
    required: false,
    description: 'Filtrar por cidade',
  })
  @ApiQuery({
    name: 'estado',
    required: false,
    description: 'Filtrar por estado',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Campo para ordenaÃ§Ã£o',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Ordem: asc ou desc',
  })
  async findAll(
    @Query() query: ListCadastrosCaoDto,
  ): Promise<CadastrosCaoListResponseDto> {
    return this.cadastroCaoService.findAll(query);
  }

  @Get('/meus-cadastros')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar cadastros do usuÃ¡rio autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Lista de cadastros retornada com sucesso',
    type: [CadastroCaoResponseDto],
  })
  @ApiResponse({ status: 401, description: 'NÃ£o autorizado' })
  async findByUser(@Request() req: any): Promise<CadastroCaoResponseDto[]> {
    return this.cadastroCaoService.findByUser(req.user.userId);
  }

  @Get('raca/:raca')
  @ApiOperation({ summary: 'Buscar cÃ£es por raÃ§a' })
  @ApiResponse({
    status: 200,
    description: 'Lista de cÃ£es da raÃ§a especificada',
    type: [CadastroCaoResponseDto],
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Limite de resultados (padrÃ£o: 10)',
  })
  async findByRaca(
    @Param('raca') raca: string,
    @Query('limit') limit?: string,
  ): Promise<CadastroCaoResponseDto[]> {
    const limitNumber = limit ? parseInt(limit) : 10;
    return this.cadastroCaoService.findByRaca(raca, limitNumber);
  }

  @Get('sexo/:sexo')
  @ApiOperation({ summary: 'Buscar cÃ£es por sexo' })
  @ApiResponse({
    status: 200,
    description: 'Lista de cÃ£es do sexo especificado',
    type: [CadastroCaoResponseDto],
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Limite de resultados (padrÃ£o: 10)',
  })
  async findBySexo(
    @Param('sexo') sexo: string,
    @Query('limit') limit?: string,
  ): Promise<CadastroCaoResponseDto[]> {
    const limitNumber = limit ? parseInt(limit) : 10;
    return this.cadastroCaoService.findBySexo(sexo, limitNumber);
  }

  @Get('com-pedigree')
  @ApiOperation({ summary: 'Buscar cÃ£es com pedigree' })
  @ApiResponse({
    status: 200,
    description: 'Lista de cÃ£es com pedigree',
    type: [CadastroCaoResponseDto],
  })
  async findComPedigree(): Promise<CadastroCaoResponseDto[]> {
    return this.cadastroCaoService.findComPedigree();
  }

  @Get('com-microchip')
  @ApiOperation({ summary: 'Buscar cÃ£es com microchip' })
  @ApiResponse({
    status: 200,
    description: 'Lista de cÃ£es com microchip',
    type: [CadastroCaoResponseDto],
  })
  async findComMicrochip(): Promise<CadastroCaoResponseDto[]> {
    return this.cadastroCaoService.findComMicrochip();
  }

  @Get('com-video')
  @ApiOperation({ summary: 'Buscar cÃ£es com vÃ­deo' })
  @ApiResponse({
    status: 200,
    description: 'Lista de cÃ£es com vÃ­deo',
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
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Limite de resultados (padrÃ£o: 5)',
  })
  async findRecentCadastros(
    @Query('limit') limit?: string,
  ): Promise<CadastroCaoResponseDto[]> {
    const limitNumber = limit ? parseInt(limit) : 5;
    return this.cadastroCaoService.findRecentCadastros(limitNumber);
  }

  @Get('usuario/:userId/count')
  @ApiOperation({ summary: 'Contar cadastros de um usuÃ¡rio' })
  @ApiResponse({
    status: 200,
    description: 'NÃºmero de cadastros do usuÃ¡rio',
    schema: { type: 'object', properties: { count: { type: 'number' } } },
  })
  async getUserCadastrosCount(
    @Param('userId') userId: string,
  ): Promise<{ count: number }> {
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
  @ApiResponse({ status: 404, description: 'Cadastro nÃ£o encontrado' })
  async findOne(@Param('id') id: string): Promise<CadastroCaoResponseDto> {
    return this.cadastroCaoService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar cadastro de cÃ£o' })
  @ApiResponse({
    status: 200,
    description: 'Cadastro atualizado com sucesso',
    type: CadastroCaoResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados invÃ¡lidos' })
  @ApiResponse({ status: 401, description: 'NÃ£o autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Sem permissÃ£o para editar este cadastro',
  })
  @ApiResponse({ status: 404, description: 'Cadastro nÃ£o encontrado' })
  async update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateCadastroCaoDto: UpdateCadastroCaoDto,
  ): Promise<CadastroCaoResponseDto> {
    return this.cadastroCaoService.updateVideoOption(
      id,
      req.user.userId,
      updateCadastroCaoDto,
    );
  }

  @Patch(':id/video')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Atualizar opÃ§Ã£o de vÃ­deo do cadastro (URL/WHATSAPP)',
  })
  @ApiResponse({
    status: 200,
    description: 'OpÃ§Ã£o de vÃ­deo atualizada com sucesso',
    type: CadastroCaoResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados invÃ¡lidos' })
  @ApiResponse({ status: 401, description: 'NÃ£o autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Sem permissÃ£o para editar este cadastro',
  })
  @ApiResponse({ status: 404, description: 'Cadastro nÃ£o encontrado' })
  async updateVideo(
    @Param('id') id: string,
    @Request() req,
    @Body() updateCadastroCaoDto: UpdateCadastroCaoDto,
  ): Promise<CadastroCaoResponseDto> {
    // Regras:
    // - videoOption = URL requer videoUrl
    // - videoOption = WHATSAPP nÃ£o requer whatsappContato
    // - NÃ£o aceita upload de arquivo neste endpoint
    return this.cadastroCaoService.updateVideoOption(
      id,
      req.user.userId,
      updateCadastroCaoDto,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Excluir cadastro de cÃ£o' })
  @ApiResponse({ status: 200, description: 'Cadastro excluÃ­do com sucesso' })
  @ApiResponse({ status: 401, description: 'NÃ£o autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Sem permissÃ£o para excluir este cadastro',
  })
  @ApiResponse({ status: 404, description: 'Cadastro nÃ£o encontrado' })
  async remove(
    @Param('id') id: string,
    @Request() req,
  ): Promise<{ message: string }> {
    await this.cadastroCaoService.remove(id, req.user.userId);
    return { message: 'Cadastro excluÃ­do com sucesso' };
  }

  @Post(':id/aprovar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.FUNCIONARIO)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aprovar ou rejeitar cadastro de cÃ£o' })
  @ApiResponse({
    status: 200,
    description: 'Cadastro aprovado/rejeitado com sucesso',
    type: AprovarCadastroResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados invÃ¡lidos' })
  @ApiResponse({ status: 401, description: 'NÃ£o autorizado' })
  @ApiResponse({ status: 403, description: 'Sem permissÃ£o' })
  @ApiResponse({ status: 404, description: 'Cadastro nÃ£o encontrado' })
  async aprovarOuRejeitar(
    @Param('id') id: string,
    @Body() aprovarCadastroDto: AprovarCadastroDto,
    @Request() req,
  ): Promise<AprovarCadastroResponseDto> {
    const adminId = req.user.userId;

    let resultado: CadastroCaoResponseDto;
    let mensagem: string;

    if (aprovarCadastroDto.acao === AcaoCadastro.APROVAR) {
      resultado = await this.cadastroCaoService.aprovarCadastro(id, adminId);
      mensagem = 'Cadastro aprovado com sucesso';
    } else {
      if (!aprovarCadastroDto.motivoRejeicao) {
        throw new BadRequestException(
          'Motivo da rejeiÃ§Ã£o Ã© obrigatÃ³rio ao rejeitar um cadastro',
        );
      }
      resultado = await this.cadastroCaoService.rejeitarCadastro(
        id,
        aprovarCadastroDto.motivoRejeicao,
        adminId,
      );
      mensagem = 'Cadastro rejeitado com sucesso';
    }

    return {
      cadastroId: resultado.cadastroId,
      status: resultado.status,
      mensagem,
      dataAcao: resultado.aprovadoEm!,
    };
  }

  @Get('pendentes/validacao')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.FUNCIONARIO)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar cadastros pendentes de validaÃ§Ã£o' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Limite de resultados (padrÃ£o: 50)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de cadastros pendentes',
    type: [CadastroCaoResponseDto],
  })
  @ApiResponse({ status: 401, description: 'NÃ£o autorizado' })
  @ApiResponse({ status: 403, description: 'Sem permissÃ£o' })
  async listarPendentesValidacao(
    @Query('limit') limit?: string,
  ): Promise<CadastroCaoResponseDto[]> {
    const limitNumber = limit ? parseInt(limit) : 50;
    return this.cadastroCaoService.findPendentesValidacao(limitNumber);
  }

  @Get('pendentes/count')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.FUNCIONARIO)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Contar cadastros pendentes de validaÃ§Ã£o' })
  @ApiResponse({
    status: 200,
    description: 'Contagem de cadastros pendentes',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number', example: 5 },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'NÃ£o autorizado' })
  @ApiResponse({ status: 403, description: 'Sem permissÃ£o' })
  async contarPendentesValidacao(): Promise<{ count: number }> {
    const count = await this.cadastroCaoService.countPendentesValidacao();
    return { count };
  }

  @Get('pendentes-raca')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.FUNCIONARIO)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Listar cadastros com raÃ§as pendentes de aprovaÃ§Ã£o',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Limite de resultados (padrÃ£o: 50)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de cadastros com raÃ§as pendentes',
    type: [CadastroCaoResponseDto],
  })
  @ApiResponse({ status: 401, description: 'NÃ£o autorizado' })
  @ApiResponse({ status: 403, description: 'Sem permissÃ£o' })
  async listarPendentesRaca(
    @Query('limit') limit?: string,
  ): Promise<CadastroCaoResponseDto[]> {
    const limitNumber = limit ? parseInt(limit) : 50;
    return this.cadastroCaoService.findPendentesRaca(limitNumber);
  }
}
