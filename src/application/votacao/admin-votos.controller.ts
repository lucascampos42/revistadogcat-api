import {
  Controller,
  Get,
  Post,
  Delete,
  Put,
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
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { User } from '../../core/decorators/get-user.decorator';
import { Role } from '@prisma/client';
import { VotacaoService } from './votacao.service';
import {
  ListVotosDto,
  VotosListResponseDto,
  EstatisticasVotacaoDto,
  BaseResponseDto,
} from '../../core/dto';

@ApiTags('Admin - Votação')
@Controller('admin/votos')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminVotosController {
  constructor(private readonly votacaoService: VotacaoService) {}

  @Get('listar')
  @Roles(Role.ADMIN, Role.FUNCIONARIO)
  @ApiOperation({
    summary: 'Listar todos os votos (Admin)',
    description:
      'Lista todos os votos com informações completas para administradores',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de votos com informações completas',
    type: VotosListResponseDto,
  })
  async listarVotos(
    @Query() params: ListVotosDto,
  ): Promise<VotosListResponseDto> {
    return this.votacaoService.listarVotos(params);
  }

  @Get('estatisticas-completas')
  @Roles(Role.ADMIN, Role.FUNCIONARIO)
  @ApiOperation({
    summary: 'Estatísticas completas de votação',
    description: 'Obtém estatísticas detalhadas do sistema de votação',
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas completas de votação',
    type: EstatisticasVotacaoDto,
  })
  async obterEstatisticasCompletas(): Promise<EstatisticasVotacaoDto> {
    return this.votacaoService.obterEstatisticas();
  }

  @Put('definir-votos-usuario/:userId')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Definir votos disponíveis para usuário',
    description:
      'Define a quantidade de votos disponíveis para um usuário específico',
  })
  @ApiResponse({
    status: 200,
    description: 'Votos definidos com sucesso',
  })
  async definirVotosUsuario(
    @Param('userId') userId: string,
    @Body()
    body: { quantidadeComum?: number; quantidadeSuper?: number },
  ): Promise<BaseResponseDto> {
    if (
      body.quantidadeComum === undefined &&
      body.quantidadeSuper === undefined
    ) {
      throw new Error(
        'Informe quantidadeComum e/ou quantidadeSuper para atualizar os saldos',
      );
    }

    await this.votacaoService['prisma'].user.update({
      where: { userId },
      data: {
        ...(body.quantidadeComum !== undefined
          ? {
              votosDisponiveisComum: body.quantidadeComum,
            }
          : {}),
        ...(body.quantidadeSuper !== undefined
          ? { votosDisponiveisSuper: body.quantidadeSuper }
          : {}),
      },
    });

    return {
      success: true,
      message: `Saldos de votos atualizados para o usuário`,
      timestamp: new Date().toISOString(),
      statusCode: 200,
    };
  }

  @Put('resetar-votos-utilizados')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Resetar votos utilizados',
    description:
      'Reseta os votos utilizados de todos os usuários ou de um usuário específico',
  })
  @ApiResponse({
    status: 200,
    description: 'Votos utilizados resetados com sucesso',
  })
  async resetarVotosUtilizados(
    @Body() body?: { userId?: string },
  ): Promise<BaseResponseDto> {
    await this.votacaoService.resetarVotosUtilizados(body?.userId);

    const message = body?.userId
      ? `Votos utilizados resetados para o usuário ${body.userId}`
      : 'Votos utilizados resetados para todos os usuários';

    return {
      success: true,
      message,
      timestamp: new Date().toISOString(),
      statusCode: 200,
    };
  }

  @Delete('invalidar-voto/:votoId')
  @Roles(Role.ADMIN, Role.FUNCIONARIO)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Invalidar voto',
    description: 'Invalida um voto específico (ação administrativa)',
  })
  @ApiResponse({
    status: 204,
    description: 'Voto invalidado com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Voto não encontrado',
  })
  async invalidarVoto(
    @Param('votoId') votoId: string,
    @User('userId') adminUserId: string,
    @Body() body: { observacoes?: string },
    @Req() req: Request,
  ): Promise<void> {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    await this.votacaoService.invalidarVoto(
      votoId,
      adminUserId,
      body.observacoes,
      ip,
      userAgent,
    );
  }

  @Get('usuario/:userId/votos')
  @Roles(Role.ADMIN, Role.FUNCIONARIO)
  @ApiOperation({
    summary: 'Listar votos de um usuário',
    description: 'Lista todos os votos de um usuário específico',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de votos do usuário',
  })
  async listarVotosUsuario(@Param('userId') userId: string) {
    const votos = await this.votacaoService.obterVotosUsuario(userId);

    // Buscar informações adicionais do usuário
    const usuario = await this.votacaoService['prisma'].user.findUnique({
      where: { userId },
      select: {
        userId: true,
        name: true,
        email: true,
        votosDisponiveisComum: true,
        votosUtilizadosComum: true,
        votosDisponiveisSuper: true,
        votosUtilizadosSuper: true,
      },
    });

    return {
      usuario,
      votos,
      totalVotos: votos.length,
    };
  }

  @Get('cadastro/:cadastroId/votos')
  @Roles(Role.ADMIN, Role.FUNCIONARIO)
  @ApiOperation({
    summary: 'Listar votos de um cadastro',
    description: 'Lista todos os votos recebidos por um cadastro de cão',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de votos do cadastro',
  })
  async listarVotosCadastro(@Param('cadastroId') cadastroId: string) {
    const votos = await this.votacaoService['prisma'].voto.findMany({
      where: { cadastroId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            userId: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Buscar informações do cadastro
    const cadastro = await this.votacaoService['prisma'].cadastroCao.findUnique(
      {
        where: { cadastroId },
        select: {
          cadastroId: true,
          nome: true,
          totalVotos: true,
          user: {
            select: {
              userId: true,
              name: true,
              email: true,
            },
          },
        },
      },
    );

    return {
      cadastro,
      votos,
      totalVotos: votos.length,
    };
  }

  @Post('definir-votos-em-lote')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Definir votos em lote',
    description:
      'Define votos disponíveis para múltiplos usuários baseado em critérios',
  })
  @ApiResponse({
    status: 200,
    description: 'Votos definidos em lote com sucesso',
  })
  async definirVotosEmLote(
    @Body()
    body: {
      quantidade: number;
      quantidadeSuper?: number;
      filtro: {
        role?: Role;
        ativo?: boolean;
        assinante?: boolean;
        donoDeCao?: boolean;
      };
    },
  ): Promise<BaseResponseDto> {
    const where: any = {};

    if (body.filtro.role) {
      where.role = body.filtro.role;
    }

    if (body.filtro.ativo !== undefined) {
      where.active = body.filtro.ativo;
    }

    // Lógica para assinantes baseada no role
    if (body.filtro.assinante) {
      where.role = {
        in: [Role.ASSINANTE, Role.DONO_PET_APROVADO_ASSINANTE],
      };
    }

    // Filtro por donos de cão
    if (body.filtro.donoDeCao) {
      where.cadastrosCao = { some: {} };
    }

    const data: any = {
      votosDisponiveisComum: body.quantidade,
    };

    if (body.quantidadeSuper !== undefined) {
      data.votosDisponiveisSuper = body.quantidadeSuper;
    }

    const resultado = await this.votacaoService['prisma'].user.updateMany({
      where,
      data,
    });

    return {
      success: true,
      message: `Saldos de votos definidos para ${resultado.count} usuários`,
      timestamp: new Date().toISOString(),
      statusCode: 200,
    };
  }
}
