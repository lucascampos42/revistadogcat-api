import {
  Controller,
  Get,
  Query,
  UseGuards,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { KardexService } from './kardex.service';
import { ListKardexDto, KardexListResponseDto } from '../../core/dto';

@ApiTags('Kardex - Histórico de Votos')
@Controller('kardex')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class KardexController {
  constructor(private readonly kardexService: KardexService) {}

  @Get('listar')
  @Roles(Role.ADMIN, Role.FUNCIONARIO)
  @ApiOperation({
    summary: 'Listar registros do Kardex',
    description: 'Lista registros do histórico de ações de votação com filtros',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de registros do Kardex',
    type: KardexListResponseDto,
  })
  async listarKardex(
    @Query() params: ListKardexDto,
  ): Promise<KardexListResponseDto> {
    return this.kardexService.listarKardex(params);
  }

  @Get('estatisticas')
  @Roles(Role.ADMIN, Role.FUNCIONARIO)
  @ApiOperation({
    summary: 'Estatísticas do Kardex',
    description: 'Obtém estatísticas dos registros do Kardex por período',
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas do Kardex',
  })
  async obterEstatisticas(
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return this.kardexService.obterEstatisticasKardex();
  }

  @Get('historico-usuario/:userId')
  @Roles(Role.ADMIN, Role.FUNCIONARIO)
  @ApiOperation({
    summary: 'Histórico de um usuário',
    description: 'Obtém o histórico completo de ações de votação de um usuário',
  })
  @ApiResponse({
    status: 200,
    description: 'Histórico do usuário',
  })
  async obterHistoricoUsuario(
    @Param('userId') userId: string,
    @Query('limite') limite?: number,
  ) {
    return this.kardexService.obterHistoricoUsuario(
      userId,
      limite ? parseInt(limite.toString()) : undefined,
    );
  }

  @Get('historico-cadastro/:cadastroId')
  @Roles(Role.ADMIN, Role.FUNCIONARIO)
  @ApiOperation({
    summary: 'Histórico de um cadastro',
    description:
      'Obtém o histórico completo de votos recebidos por um cadastro',
  })
  @ApiResponse({
    status: 200,
    description: 'Histórico do cadastro',
  })
  async obterHistoricoCadastro(
    @Param('cadastroId') cadastroId: string,
    @Query('limite') limite?: number,
  ) {
    return this.kardexService.obterHistoricoCadastro(
      cadastroId,
      limite ? parseInt(limite.toString()) : undefined,
    );
  }

  @Get('auditoria')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Relatório de auditoria',
    description:
      'Gera relatório de auditoria com todas as ações administrativas',
  })
  @ApiResponse({
    status: 200,
    description: 'Relatório de auditoria',
  })
  async relatorioAuditoria(
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
    @Query('adminUserId') adminUserId?: string,
  ) {
    const filtros: any = {};

    if (dataInicio) {
      filtros.dataInicio = new Date(dataInicio);
    }

    if (dataFim) {
      filtros.dataFim = new Date(dataFim);
    }

    if (adminUserId) {
      filtros.adminUserId = adminUserId;
    }

    const registros = await this.kardexService['prisma'].kardexVoto.findMany({
      where: {
        ...(filtros.dataInicio && { createdAt: { gte: filtros.dataInicio } }),
        ...(filtros.dataFim && { createdAt: { lte: filtros.dataFim } }),
        acao: {
          in: ['VOTO_INVALIDADO', 'USUARIO_BLOQUEADO', 'CADASTRO_DESATIVADO'],
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Agrupar por tipo de ação
    const estatisticas = {
      totalRegistros: registros.length,
      porAcao: registros.reduce(
        (acc, registro) => {
          acc[registro.acao] = (acc[registro.acao] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
      porUsuario: registros.reduce(
        (acc, registro) => {
          acc[registro.userId] = (acc[registro.userId] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };

    return {
      periodo: {
        inicio: filtros.dataInicio || 'Início dos registros',
        fim: filtros.dataFim || 'Agora',
      },
      estatisticas,
      registros,
    };
  }

  @Get('resumo-diario')
  @Roles(Role.ADMIN, Role.FUNCIONARIO)
  @ApiOperation({
    summary: 'Resumo diário de votação',
    description: 'Obtém resumo das atividades de votação por dia',
  })
  @ApiResponse({
    status: 200,
    description: 'Resumo diário',
  })
  async resumoDiario(@Query('dias') dias: number = 30) {
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - dias);

    const registros = await this.kardexService['prisma'].kardexVoto.findMany({
      where: {
        createdAt: { gte: dataInicio },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Agrupar por dia
    const resumoPorDia = registros.reduce(
      (acc, registro) => {
        const dia = registro.createdAt.toISOString().split('T')[0];

        if (!acc[dia]) {
          acc[dia] = {
            data: dia,
            votos: 0,
            remocoes: 0,
            invalidacoes: 0,
            outros: 0,
          };
        }

        switch (registro.acao) {
          case 'VOTO_CRIADO':
            acc[dia].votos++;
            break;
          case 'VOTO_REMOVIDO':
            acc[dia].remocoes++;
            break;
          case 'VOTO_INVALIDADO':
            acc[dia].invalidacoes++;
            break;
          default:
            acc[dia].outros++;
        }

        return acc;
      },
      {} as Record<string, any>,
    );

    return {
      periodo: `Últimos ${dias} dias`,
      resumo: Object.values(resumoPorDia).sort(
        (a: any, b: any) =>
          new Date(b.data).getTime() - new Date(a.data).getTime(),
      ),
    };
  }

  @Delete('limpar-antigos')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Limpar registros antigos',
    description:
      'Remove registros do Kardex mais antigos que o período especificado',
  })
  @ApiResponse({
    status: 204,
    description: 'Registros antigos removidos com sucesso',
  })
  async limparRegistrosAntigos(
    @Query('dias') dias: number = 365,
  ): Promise<void> {
    await this.kardexService.limparKardexAntigo(dias);
  }

  @Get('exportar')
  @Roles(Role.ADMIN, Role.FUNCIONARIO)
  @ApiOperation({
    summary: 'Exportar registros do Kardex',
    description: 'Exporta registros do Kardex em formato CSV',
  })
  @ApiResponse({
    status: 200,
    description: 'Arquivo CSV com registros do Kardex',
  })
  async exportarKardex(@Query() params: ListKardexDto) {
    const dados = await this.kardexService.listarKardex({
      ...params,
      page: 1,
      limit: 10000, // Limite alto para exportação
    });

    // Converter para formato CSV
    const headers = [
      'Data',
      'Ação',
      'ID Usuário',
      'ID Cadastro',
      'IP',
      'User Agent',
      'Observações',
    ];

    const linhas = dados.kardex.map((registro) => [
      registro.createdAt.toISOString(),
      registro.acao,
      registro.userId,
      registro.cadastroId,
      registro.ip || 'N/A',
      registro.userAgent || 'N/A',
      registro.observacoes || 'N/A',
    ]);

    const csv = [headers, ...linhas]
      .map((linha) => linha.map((campo) => `"${campo}"`).join(','))
      .join('\n');

    return {
      filename: `kardex_votos_${new Date().toISOString().split('T')[0]}.csv`,
      content: csv,
      contentType: 'text/csv',
    };
  }
}
