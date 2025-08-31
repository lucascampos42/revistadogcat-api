import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { EnderecoService } from './endereco.service';
import {
  CreateEnderecoDto,
  UpdateEnderecoDto,
  EnderecoFiltersDto,
  EnderecoResponseDto,
} from './dto';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { EnderecoEntity } from './entities/endereco.entity';

@ApiTags('Endereços')
@Controller('users/:userId/enderecos')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EnderecoController {
  constructor(private readonly enderecoService: EnderecoService) {}

  @Post('enderecos')
  @ApiOperation({ summary: 'Criar um novo endereço para o usuário autenticado' })
  @ApiResponse({
    status: 201,
    description: 'Endereço criado com sucesso',
    type: EnderecoResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async create(
    @Body() createEnderecoDto: CreateEnderecoDto,
    @Request() req: any,
  ): Promise<EnderecoResponseDto> {
    return this.enderecoService.create(req.user.userId, createEnderecoDto, req.user);
  }

  @Get('enderecos')
  @ApiOperation({ summary: 'Listar endereços do usuário autenticado' })
  @ApiQuery({ name: 'ativo', required: false, description: 'Filtrar por status ativo' })
  @ApiQuery({ name: 'tipo', required: false, description: 'Filtrar por tipo de endereço' })
  @ApiResponse({ status: 200, description: 'Lista de endereços', type: [EnderecoResponseDto] })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async findByUserId(
    @Request() req: any,
    @Query('ativo') ativo?: string,
    @Query('tipo') tipo?: string,
  ): Promise<EnderecoResponseDto[]> {
    const ativoBoolean = ativo !== undefined ? ativo === 'true' : undefined;
    const filters: EnderecoFiltersDto = { ativo: ativoBoolean, tipo: tipo as any };
    const result = await this.enderecoService.findByUserId(req.user.userId, filters, req.user);
    return result.enderecos;
  }

  @Get(':enderecoId')
  @ApiOperation({ summary: 'Obter um endereço específico pelo ID' })
  @ApiParam({ name: 'userId', description: 'ID do usuário' })
  @ApiParam({ name: 'enderecoId', description: 'ID do endereço' })
  @ApiResponse({ status: 200, description: 'Endereço retornado com sucesso', type: EnderecoEntity })
  @ApiResponse({ status: 403, description: 'Sem permissão para acessar este endereço' })
  @ApiResponse({ status: 404, description: 'Endereço não encontrado' })
  async findById(
    @Param('userId') userId: string,
    @Param('enderecoId') enderecoId: string,
    @Request() req: any,
  ): Promise<EnderecoEntity> {
    const endereco = await this.enderecoService.findById(userId, enderecoId, req.user);
    return new EnderecoEntity(endereco as Partial<EnderecoEntity>);
  }

  @Put('enderecos/:enderecoId')
  @ApiOperation({ summary: 'Atualizar um endereço existente' })
  @ApiParam({ name: 'enderecoId', description: 'ID do endereço' })
  @ApiResponse({ status: 200, description: 'Endereço atualizado com sucesso', type: EnderecoResponseDto })
  @ApiResponse({ status: 404, description: 'Endereço não encontrado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async update(
    @Param('enderecoId') enderecoId: string,
    @Body() updateEnderecoDto: UpdateEnderecoDto,
    @Request() req: any,
  ): Promise<EnderecoResponseDto> {
    return this.enderecoService.update(req.user.userId, enderecoId, updateEnderecoDto, req.user);
  }

  @Patch('enderecos/:enderecoId/principal')
  @ApiOperation({ summary: 'Definir um endereço como principal' })
  @ApiParam({ name: 'enderecoId', description: 'ID do endereço' })
  @ApiResponse({ status: 200, description: 'Endereço definido como principal', type: EnderecoResponseDto })
  @ApiResponse({ status: 404, description: 'Endereço não encontrado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async setPrincipal(
    @Param('enderecoId') enderecoId: string,
    @Request() req: any,
  ): Promise<EnderecoResponseDto> {
    return this.enderecoService.setPrincipal(req.user.userId, enderecoId, req.user);
  }

  @Patch('enderecos/:enderecoId/desativar')
  @ApiOperation({ summary: 'Desativar um endereço' })
  @ApiParam({ name: 'enderecoId', description: 'ID do endereço' })
  @ApiResponse({ status: 200, description: 'Endereço desativado com sucesso', type: EnderecoResponseDto })
  @ApiResponse({ status: 404, description: 'Endereço não encontrado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async deactivate(
    @Param('enderecoId') enderecoId: string,
    @Request() req: any,
  ): Promise<EnderecoResponseDto> {
    return this.enderecoService.deactivate(req.user.userId, enderecoId, req.user);
  }

  @Patch('enderecos/:enderecoId/reativar')
  @ApiOperation({ summary: 'Reativar um endereço' })
  @ApiParam({ name: 'enderecoId', description: 'ID do endereço' })
  @ApiResponse({ status: 200, description: 'Endereço reativado com sucesso', type: EnderecoResponseDto })
  @ApiResponse({ status: 404, description: 'Endereço não encontrado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async reactivate(
    @Param('enderecoId') enderecoId: string,
    @Request() req: any,
  ): Promise<EnderecoResponseDto> {
    return this.enderecoService.reactivate(
      req.user.userId,
      enderecoId,
      req.user,
    );
  }

  @Delete('enderecos/:enderecoId')
  @ApiOperation({ summary: 'Excluir um endereço permanentemente' })
  @ApiParam({ name: 'enderecoId', description: 'ID do endereço' })
  @ApiResponse({ status: 200, description: 'Endereço excluído com sucesso' })
  @ApiResponse({ status: 404, description: 'Endereço não encontrado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async remove(
    @Param('enderecoId') enderecoId: string,
    @Request() req: any,
  ): Promise<void> {
    return this.enderecoService.delete(req.user.userId, enderecoId, req.user);
  }
}
