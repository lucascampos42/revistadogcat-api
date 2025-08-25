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
} from './dto';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { EnderecoEntity } from './entities/endereco.entity';

@ApiTags('Endereços')
@Controller('api')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EnderecoController {
  constructor(private readonly enderecoService: EnderecoService) {}

  @Post('users/:userId/enderecos')
  @ApiOperation({ summary: 'Criar novo endereço para um usuário' })
  @ApiParam({ name: 'userId', description: 'ID do usuário' })
  @ApiResponse({
    status: 201,
    description: 'Endereço criado com sucesso',
    type: EnderecoEntity,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou limite excedido',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para criar endereço para este usuário',
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async create(
    @Param('userId') userId: string,
    @Body() createEnderecoDto: CreateEnderecoDto,
    @Request() req: any,
  ): Promise<EnderecoEntity> {
    const endereco = await this.enderecoService.create(
      userId,
      createEnderecoDto,
      req.user,
    );
    return new EnderecoEntity(endereco);
  }

  @Get('users/:userId/enderecos')
  @ApiOperation({ summary: 'Listar endereços de um usuário' })
  @ApiParam({ name: 'userId', description: 'ID do usuário' })
  @ApiQuery({
    name: 'ativo',
    required: false,
    type: Boolean,
    description: 'Filtrar por status ativo',
  })
  @ApiQuery({
    name: 'tipo',
    required: false,
    enum: [
      'RESIDENCIAL',
      'COMERCIAL',
      'ENTREGA',
      'COBRANCA',
      'TEMPORARIO',
      'OUTRO',
    ],
    description: 'Filtrar por tipo de endereço',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de endereços retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        enderecos: {
          type: 'array',
          items: { $ref: '#/components/schemas/EnderecoEntity' },
        },
        total: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para acessar endereços deste usuário',
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async findByUserId(
    @Param('userId') userId: string,
    @Query() filters: EnderecoFiltersDto,
    @Request() req: any,
  ) {
    const result = await this.enderecoService.findByUserId(
      userId,
      filters,
      req.user,
    );
    return {
      enderecos: result.enderecos.map(
        (endereco) => new EnderecoEntity(endereco),
      ),
      total: result.total,
    };
  }

  @Get('enderecos/:enderecoId')
  @ApiOperation({ summary: 'Obter endereço específico por ID' })
  @ApiParam({ name: 'enderecoId', description: 'ID do endereço' })
  @ApiResponse({
    status: 200,
    description: 'Endereço retornado com sucesso',
    type: EnderecoEntity,
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para acessar este endereço',
  })
  @ApiResponse({ status: 404, description: 'Endereço não encontrado' })
  async findById(
    @Param('enderecoId') enderecoId: string,
    @Request() req: any,
  ): Promise<EnderecoEntity> {
    const endereco = await this.enderecoService.findById(enderecoId, req.user);
    return new EnderecoEntity(endereco as Partial<EnderecoEntity>);
  }

  @Put('enderecos/:enderecoId')
  @ApiOperation({ summary: 'Atualizar endereço completo' })
  @ApiParam({ name: 'enderecoId', description: 'ID do endereço' })
  @ApiResponse({
    status: 200,
    description: 'Endereço atualizado com sucesso',
    type: EnderecoEntity,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para atualizar este endereço',
  })
  @ApiResponse({ status: 404, description: 'Endereço não encontrado' })
  async update(
    @Param('enderecoId') enderecoId: string,
    @Body() updateEnderecoDto: UpdateEnderecoDto,
    @Request() req: any,
  ): Promise<EnderecoEntity> {
    const endereco = await this.enderecoService.update(
      enderecoId,
      updateEnderecoDto,
      req.user,
    );
    return new EnderecoEntity(endereco);
  }

  @Patch('enderecos/:enderecoId/principal')
  @ApiOperation({ summary: 'Definir endereço como principal' })
  @ApiParam({ name: 'enderecoId', description: 'ID do endereço' })
  @ApiResponse({
    status: 200,
    description: 'Endereço definido como principal com sucesso',
    type: EnderecoEntity,
  })
  @ApiResponse({
    status: 400,
    description: 'Endereço inativo não pode ser principal',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para modificar este endereço',
  })
  @ApiResponse({ status: 404, description: 'Endereço não encontrado' })
  async setPrincipal(
    @Param('enderecoId') enderecoId: string,
    @Request() req: any,
  ): Promise<EnderecoEntity> {
    const endereco = await this.enderecoService.setPrincipal(enderecoId, req.user);
    return new EnderecoEntity(endereco);
  }

  @Patch('enderecos/:enderecoId/desativar')
  @ApiOperation({ summary: 'Desativar endereço' })
  @ApiParam({ name: 'enderecoId', description: 'ID do endereço' })
  @ApiResponse({
    status: 200,
    description: 'Endereço desativado com sucesso',
    type: EnderecoEntity,
  })
  @ApiResponse({ status: 400, description: 'Não é possível desativar o último endereço ativo' })
  @ApiResponse({ status: 403, description: 'Sem permissão para modificar este endereço' })
  @ApiResponse({ status: 404, description: 'Endereço não encontrado' })
  async deactivate(
    @Param('enderecoId') enderecoId: string,
    @Request() req: any,
  ): Promise<EnderecoEntity> {
    const endereco = await this.enderecoService.deactivate(enderecoId, req.user);
    return new EnderecoEntity(endereco);
  }

  @Patch('enderecos/:enderecoId/reativar')
  @ApiOperation({ summary: 'Reativar endereço' })
  @ApiParam({ name: 'enderecoId', description: 'ID do endereço' })
  @ApiResponse({
    status: 200,
    description: 'Endereço reativado com sucesso',
    type: EnderecoEntity,
  })
  @ApiResponse({ status: 400, description: 'Limite de endereços ativos excedido' })
  @ApiResponse({ status: 403, description: 'Sem permissão para modificar este endereço' })
  @ApiResponse({ status: 404, description: 'Endereço não encontrado' })
  async reactivate(
    @Param('enderecoId') enderecoId: string,
    @Request() req: any,
  ): Promise<EnderecoEntity> {
    const endereco = await this.enderecoService.reactivate(enderecoId, req.user);
    return new EnderecoEntity(endereco);
  }

  @Delete('enderecos/:enderecoId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir endereço permanentemente' })
  @ApiParam({ name: 'enderecoId', description: 'ID do endereço' })
  @ApiResponse({ status: 204, description: 'Endereço excluído com sucesso' })
  @ApiResponse({ status: 400, description: 'Não é possível excluir endereço principal ou último ativo' })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para excluir este endereço',
  })
  @ApiResponse({ status: 404, description: 'Endereço não encontrado' })
  async delete(
    @Param('enderecoId') enderecoId: string,
    @Request() req: any,
  ): Promise<void> {
    await this.enderecoService.delete(enderecoId, req.user);
  }
}
