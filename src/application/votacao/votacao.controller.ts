import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request } from 'express';
import { VotoTipo } from '@prisma/client';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { User } from '../../core/decorators/get-user.decorator';
import { VotacaoService } from './votacao.service';
import {
  CreateVotoDto,
  VotoResponseDto,
  ListVotosDto,
  VotosListResponseDto,
  EstatisticasVotacaoDto,
} from '../../core/dto';

@ApiTags('Votação')
@Controller('votacao')
export class VotacaoController {
  constructor(private readonly votacaoService: VotacaoService) {}

  @Post('votar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Votar em um cão',
    description: 'Permite que um usuário autenticado vote em um cão cadastrado',
  })
  @ApiResponse({
    status: 201,
    description: 'Voto registrado com sucesso',
    type: VotoResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou usuário sem votos disponíveis',
  })
  @ApiResponse({
    status: 403,
    description: 'Usuário bloqueado ou inativo',
  })
  @ApiResponse({
    status: 404,
    description: 'Cadastro de cão não encontrado',
  })
  async votar(
    @User('userId') userId: string,
    @Body() createVotoDto: CreateVotoDto,
    @Req() req: Request,
  ): Promise<VotoResponseDto> {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    return this.votacaoService.votar(userId, createVotoDto, ip, userAgent);
  }

  @Delete('remover/:cadastroId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remover voto',
    description: 'Permite que um usuário remova seu voto de um cão',
  })
  @ApiResponse({
    status: 204,
    description: 'Voto removido com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Voto não encontrado',
  })
  async removerVoto(
    @User('userId') userId: string,
    @Param('cadastroId') cadastroId: string,
    @Query('tipo') tipo: VotoTipo,
    @Req() req: Request,
  ): Promise<void> {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    return this.votacaoService.removerVoto(
      userId,
      cadastroId,
      tipo,
      ip,
      userAgent,
    );
  }

  @Get('meus-votos')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Listar meus votos',
    description: 'Lista todos os votos do usuário autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de votos do usuário',
    type: [VotoResponseDto],
  })
  async obterMeusVotos(
    @User('userId') userId: string,
  ): Promise<VotoResponseDto[]> {
    return this.votacaoService.obterVotosUsuario(userId);
  }

  @Get('estatisticas')
  @ApiOperation({
    summary: 'Estatísticas de votação',
    description: 'Obtém estatísticas gerais do sistema de votação',
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas de votação',
    type: EstatisticasVotacaoDto,
  })
  async obterEstatisticas(): Promise<EstatisticasVotacaoDto> {
    return this.votacaoService.obterEstatisticas();
  }

  @Get('publico/listar')
  @ApiOperation({
    summary: 'Listar votos (público)',
    description: 'Lista votos de forma pública com filtros básicos',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de votos',
    type: VotosListResponseDto,
  })
  async listarVotosPublico(
    @Query() params: ListVotosDto,
  ): Promise<VotosListResponseDto> {
    const votos = await this.votacaoService.listarVotos(params);

    votos.votos = votos.votos.map((voto) => ({
      ...voto,
      ip: undefined,
    }));

    return votos;
  }

  @Get('status-usuario')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Status de votação do usuário',
    description:
      'Obtém informações sobre votos disponíveis e utilizados do usuário',
  })
  @ApiResponse({
    status: 200,
    description: 'Status de votação do usuário',
  })
  async obterStatusVotacao(@User('userId') userId: string): Promise<{
    votosDisponiveisComum: number;
    votosUtilizadosComum: number;
    votosDisponiveisSuper: number;
    votosUtilizadosSuper: number;
    votosRestantesComum: number;
    votosRestantesSuper: number;
  }> {
    const usuario = await this.votacaoService['prisma'].user.findUnique({
      where: { userId },
      select: {
        votosDisponiveisComum: true,
        votosUtilizadosComum: true,
        votosDisponiveisSuper: true,
        votosUtilizadosSuper: true,
      },
    });

    if (!usuario) {
      throw new Error('Usuário não encontrado');
    }

    return {
      votosDisponiveisComum: usuario.votosDisponiveisComum,
      votosUtilizadosComum: usuario.votosUtilizadosComum,
      votosDisponiveisSuper: usuario.votosDisponiveisSuper,
      votosUtilizadosSuper: usuario.votosUtilizadosSuper,
      votosRestantesComum:
        (usuario.votosDisponiveisComum || 0) - (usuario.votosUtilizadosComum || 0),
      votosRestantesSuper:
        (usuario.votosDisponiveisSuper || 0) - (usuario.votosUtilizadosSuper || 0),
    };
  }

  @Get('verificar-voto/:cadastroId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Verificar se já votou',
    description: 'Verifica se o usuário já votou em um cão específico',
  })
  @ApiResponse({
    status: 200,
    description: 'Status do voto',
  })
  async verificarVoto(
    @User('userId') userId: string,
    @Param('cadastroId') cadastroId: string,
    @Query('tipo') tipo?: VotoTipo,
  ): Promise<{ jaVotou: boolean; voto?: VotoResponseDto }> {
    const voto = tipo
      ? await this.votacaoService['prisma'].voto.findUnique({
          where: {
            userId_cadastroId_tipo: {
              userId,
              cadastroId,
              tipo,
            },
          },
          select: {
            votoId: true,
            userId: true,
            cadastroId: true,
            tipo: true,
            createdAt: true,
            ip: true,
          },
        })
      : await this.votacaoService['prisma'].voto.findFirst({
          where: { userId, cadastroId },
          select: {
            votoId: true,
            userId: true,
            cadastroId: true,
            tipo: true,
            createdAt: true,
            ip: true,
          },
        });

    return {
      jaVotou: !!voto,
      voto: voto || undefined,
    };
  }
}
