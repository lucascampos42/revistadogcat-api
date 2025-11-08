import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/config/prisma.service';
import { Prisma } from '@prisma/client';

interface VotoComRelacoes {
  votoId: string;
  createdAt: Date;
  userId: string;
  cadastroId: string;
  ip: string | null;
  userAgent: string | null;
  user: {
    userId: string;
    name: string;
    email: string;
    role: string;
    createdAt: Date;
  };
  cadastro: {
    cadastroId: string;
    nome: string;
    totalVotos: number;
    createdAt: Date;
    raca?: {
      nome: string;
    } | null;
    user: {
      name: string;
      email: string;
    };
  };
}

interface DadosBase {
  votos: VotoComRelacoes[];
  periodo: {
    dataInicio?: Date;
    dataFim?: Date;
  };
}

interface CaoRanking {
  cadastroId: string;
  nome: string;
  raca: string;
  dono: string;
  totalVotos: number;
  primeiroVoto: Date;
  ultimoVoto: Date;
  votos: VotoComRelacoes[];
}

interface CaoRankingCompleto extends CaoRanking {
  posicao: number;
  percentualTotal: string;
  tendencia: string;
}

interface UsuarioAnalise {
  userId: string;
  nome: string;
  email: string;
  role: string;
  totalVotos: number;
  caesVotados: Set<string>;
  primeiroVoto: Date;
  ultimoVoto: Date;
}

interface TendenciaDiaria {
  data: string;
  votos: number;
}

interface FiltrosRelatorio {
  dataInicio?: Date;
  dataFim?: Date;
  incluirGraficos?: boolean;
  incluirDetalhes?: boolean;
}

@Injectable()
export class RelatorioService {
  constructor(private readonly prisma: PrismaService) {}

  async gerarRelatorioVotacao(filtros: FiltrosRelatorio) {
    const {
      dataInicio,
      dataFim,
      incluirGraficos = true,
      incluirDetalhes = true,
    } = filtros;

    // Buscar dados base
    const dadosBase = await this.obterDadosBase(dataInicio, dataFim);

    // Estrutura do relatório
    const relatorio = {
      metadata: {
        titulo: 'Relatório de Votação - Revista Dog & Cat',
        periodo: {
          inicio:
            dataInicio?.toISOString().split('T')[0] || 'Início dos registros',
          fim: dataFim?.toISOString().split('T')[0] || 'Agora',
        },
        geradoEm: new Date().toISOString(),
        versao: '1.0',
      },
      resumoExecutivo: await this.gerarResumoExecutivo(dadosBase),
      estatisticasGerais: await this.gerarEstatisticasGerais(dadosBase),
      rankingCaes: await this.gerarRankingCaes(dadosBase),
      analiseUsuarios: await this.gerarAnaliseUsuarios(dadosBase),
      tendencias: incluirGraficos
        ? await this.gerarTendencias(dadosBase)
        : null,
      detalhesVotacao: incluirDetalhes
        ? await this.gerarDetalhesVotacao(dadosBase)
        : null,
      recomendacoes: await this.gerarRecomendacoes(dadosBase),
    };

    return relatorio;
  }

  private async obterDadosBase(
    dataInicio?: Date,
    dataFim?: Date,
  ): Promise<DadosBase> {
    const where: Prisma.VotoWhereInput = {};

    if (dataInicio) {
      where.createdAt = { gte: dataInicio };
    }

    if (dataFim) {
      if (
        where.createdAt &&
        typeof where.createdAt === 'object' &&
        'gte' in where.createdAt
      ) {
        (where.createdAt as Prisma.DateTimeFilter).lte = dataFim;
      } else {
        where.createdAt = { lte: dataFim };
      }
    }

    const votos = await this.prisma.voto.findMany({
      where,
      include: {
        user: {
          select: {
            userId: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
        cadastro: {
          select: {
            cadastroId: true,
            nome: true,
            totalVotos: true,
            createdAt: true,
            raca: {
              select: {
                nome: true,
              },
            },
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return { votos, periodo: { dataInicio, dataFim } };
  }

  private async gerarResumoExecutivo(dadosBase: DadosBase) {
    const { votos } = dadosBase;

    const totalVotos = votos.length;
    const usuariosUnicos = new Set(votos.map((v) => v.userId)).size;
    const caesVotados = new Set(votos.map((v) => v.cadastroId)).size;

    // Calcular crescimento (comparar com período anterior)
    const crescimentoVotos = await this.calcularCrescimento(dadosBase);

    return {
      totalVotos,
      usuariosUnicos,
      caesVotados,
      mediaVotosPorUsuario:
        totalVotos > 0 ? (totalVotos / usuariosUnicos).toFixed(2) : 0,
      mediaVotosPorCao:
        caesVotados > 0 ? (totalVotos / caesVotados).toFixed(2) : 0,
      crescimento: crescimentoVotos,
      destaque: this.gerarDestaquePrincipal(votos),
    };
  }

  private async gerarEstatisticasGerais(dadosBase: DadosBase) {
    const { votos } = dadosBase;

    // Distribuição por role
    const distribuicaoPorRole = votos.reduce(
      (acc: Record<string, number>, voto) => {
        const role = voto.user?.role || 'INDEFINIDO';
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      },
      {},
    );

    // Distribuição por raça
    const distribuicaoPorRaca = votos.reduce(
      (acc: Record<string, number>, voto) => {
        const raca = voto.cadastro?.raca?.nome || 'Não informado';
        acc[raca] = (acc[raca] || 0) + 1;
        return acc;
      },
      {},
    );

    // Atividade por hora do dia
    const atividadePorHora = votos.reduce(
      (acc: Record<number, number>, voto) => {
        const hora = new Date(voto.createdAt).getHours();
        acc[hora] = (acc[hora] || 0) + 1;
        return acc;
      },
      {},
    );

    return {
      distribuicaoPorRole,
      distribuicaoPorRaca,
      atividadePorHora,
      picos: {
        horaMaisAtiva:
          Object.entries(atividadePorHora).sort(
            ([, a], [, b]) => b - a,
          )[0]?.[0] || 'N/A',
        racaMaisVotada:
          Object.entries(distribuicaoPorRaca).sort(
            ([, a], [, b]) => b - a,
          )[0]?.[0] || 'N/A',
      },
    };
  }

  private async gerarRankingCaes(dadosBase: DadosBase): Promise<{
    top10: CaoRankingCompleto[];
    total: number;
    estatisticas: {
      maiorPontuacao: number;
      menorPontuacao: number;
      mediaPontuacao: string;
    };
  }> {
    const { votos } = dadosBase;

    // Agrupar votos por cão
    const votosPorCao = votos.reduce(
      (acc: Record<string, CaoRanking>, voto) => {
        const key = voto.cadastroId;
        if (!acc[key]) {
          acc[key] = {
            cadastroId: voto.cadastroId,
            nome: voto.cadastro?.nome || 'N/A',
            raca: voto.cadastro?.raca?.nome || 'N/A',
            dono: voto.cadastro?.user?.name || 'N/A',
            totalVotos: 0,
            primeiroVoto: voto.createdAt,
            ultimoVoto: voto.createdAt,
            votos: [],
          };
        }
        acc[key].totalVotos++;
        acc[key].votos.push(voto);

        if (voto.createdAt < acc[key].primeiroVoto) {
          acc[key].primeiroVoto = voto.createdAt;
        }
        if (voto.createdAt > acc[key].ultimoVoto) {
          acc[key].ultimoVoto = voto.createdAt;
        }

        return acc;
      },
      {},
    );

    // Ordenar e calcular posições
    const ranking: CaoRankingCompleto[] = Object.values(votosPorCao)
      .sort((a, b) => b.totalVotos - a.totalVotos)
      .map((cao, index) => ({
        posicao: index + 1,
        ...cao,
        percentualTotal:
          votos.length > 0
            ? ((cao.totalVotos / votos.length) * 100).toFixed(2)
            : '0',
        tendencia: this.calcularTendenciaCao(cao.votos),
      }));

    return {
      top10: ranking.slice(0, 10),
      total: ranking.length,
      estatisticas: {
        maiorPontuacao: ranking[0]?.totalVotos || 0,
        menorPontuacao: ranking[ranking.length - 1]?.totalVotos || 0,
        mediaPontuacao:
          ranking.length > 0
            ? (
                ranking.reduce((sum: number, cao) => sum + cao.totalVotos, 0) /
                ranking.length
              ).toFixed(2)
            : '0',
      },
    };
  }

  private async gerarAnaliseUsuarios(dadosBase: DadosBase) {
    const { votos } = dadosBase;

    // Agrupar por usuário
    const votosPorUsuario = votos.reduce(
      (acc: Record<string, UsuarioAnalise>, voto) => {
        const key = voto.userId;
        if (!acc[key]) {
          acc[key] = {
            userId: voto.userId,
            nome: voto.user?.name || 'N/A',
            email: voto.user?.email || 'N/A',
            role: voto.user?.role || 'N/A',
            totalVotos: 0,
            caesVotados: new Set(),
            primeiroVoto: voto.createdAt,
            ultimoVoto: voto.createdAt,
          };
        }
        acc[key].totalVotos++;
        acc[key].caesVotados.add(voto.cadastroId);

        if (voto.createdAt < acc[key].primeiroVoto) {
          acc[key].primeiroVoto = voto.createdAt;
        }
        if (voto.createdAt > acc[key].ultimoVoto) {
          acc[key].ultimoVoto = voto.createdAt;
        }

        return acc;
      },
      {},
    );

    // Converter e analisar
    const usuarios = Object.values(votosPorUsuario).map((usuario) => ({
      ...usuario,
      caesVotados: usuario.caesVotados.size,
      diversidade:
        usuario.totalVotos > 0
          ? (usuario.caesVotados.size / usuario.totalVotos).toFixed(2)
          : '0',
    }));

    const usuariosAtivos = usuarios.sort((a, b) => b.totalVotos - a.totalVotos);

    return {
      totalUsuarios: usuarios.length,
      usuariosMaisAtivos: usuariosAtivos.slice(0, 10),
      distribuicaoAtividade: {
        muitoAtivos: usuarios.filter((u) => u.totalVotos >= 10).length,
        moderadamenteAtivos: usuarios.filter(
          (u) => u.totalVotos >= 5 && u.totalVotos < 10,
        ).length,
        poucosAtivos: usuarios.filter((u) => u.totalVotos < 5).length,
      },
      engajamento: {
        mediaDiversidade:
          usuarios.length > 0
            ? (
                usuarios.reduce(
                  (sum: number, u) => sum + parseFloat(u.diversidade),
                  0,
                ) / usuarios.length
              ).toFixed(2)
            : '0',
      },
    };
  }

  private async gerarTendencias(dadosBase: DadosBase) {
    const { votos } = dadosBase;

    // Agrupar por dia
    const votosPorDia = votos.reduce((acc: Record<string, number>, voto) => {
      const dia = voto.createdAt.toISOString().split('T')[0];
      acc[dia] = (acc[dia] || 0) + 1;
      return acc;
    }, {});

    // Ordenar por data
    const tendenciaDiaria: TendenciaDiaria[] = Object.entries(votosPorDia)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([data, votos]) => ({ data, votos }));

    return {
      tendenciaDiaria,
      picos: this.identificarPicos(tendenciaDiaria),
      crescimento: this.calcularTaxaCrescimento(tendenciaDiaria),
    };
  }

  private async gerarDetalhesVotacao(dadosBase: DadosBase) {
    const { votos } = dadosBase;

    return {
      ultimosVotos: votos
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 50)
        .map((voto) => ({
          data: voto.createdAt,
          usuario: voto.user?.name || 'N/A',
          cao: voto.cadastro?.nome || 'N/A',
          raca: voto.cadastro?.raca?.nome || 'N/A',
        })),
      distribuicaoTemporal: this.analisarDistribuicaoTemporal(votos),
    };
  }

  private async gerarRecomendacoes(dadosBase: DadosBase) {
    const { votos } = dadosBase;
    const recomendacoes: Array<{
      tipo: string;
      prioridade: string;
      titulo: string;
      descricao: string;
      acoes: string[];
    }> = [];

    // Análise de engajamento
    const usuariosUnicos = new Set(votos.map((v) => v.userId)).size;
    const totalUsuarios = await this.prisma.user.count({
      where: { active: true },
    });
    const taxaEngajamento =
      totalUsuarios > 0 ? (usuariosUnicos / totalUsuarios) * 100 : 0;

    if (taxaEngajamento < 30) {
      recomendacoes.push({
        tipo: 'ENGAJAMENTO',
        prioridade: 'ALTA',
        titulo: 'Baixa taxa de engajamento',
        descricao: `Apenas ${taxaEngajamento.toFixed(1)}% dos usuários participaram da votação`,
        acoes: [
          'Implementar notificações push para lembrar usuários de votar',
          'Criar campanhas de incentivo à participação',
          'Revisar UX da funcionalidade de votação',
        ],
      });
    }

    // Análise de concentração de votos
    const votosPorCao = votos.reduce((acc: Record<string, number>, voto) => {
      acc[voto.cadastroId] = (acc[voto.cadastroId] || 0) + 1;
      return acc;
    }, {});

    const votosOrdenados = Object.values(votosPorCao).sort((a, b) => b - a);
    const top3Votos: number = votosOrdenados
      .slice(0, 3)
      .reduce((sum: number, votos: number) => sum + votos, 0);
    const concentracao =
      votos.length > 0 ? (top3Votos / votos.length) * 100 : 0;

    if (concentracao > 60) {
      recomendacoes.push({
        tipo: 'DISTRIBUICAO',
        prioridade: 'MEDIA',
        titulo: 'Alta concentração de votos',
        descricao: `${concentracao.toFixed(1)}% dos votos estão concentrados nos top 3 cães`,
        acoes: [
          'Promover maior diversidade de participantes',
          'Destacar cães com menos votos na interface',
          'Implementar sistema de categorias para votação',
        ],
      });
    }

    return recomendacoes;
  }

  // Métodos auxiliares
  private async calcularCrescimento(dadosBase: DadosBase) {
    // Implementar lógica de comparação com período anterior
    return {
      percentual: 0,
      tendencia: 'ESTAVEL' as const,
    };
  }

  private gerarDestaquePrincipal(votos: VotoComRelacoes[]): string {
    if (votos.length === 0) return 'Nenhum voto registrado no período';

    const votosPorCao = votos.reduce((acc: Record<string, number>, voto) => {
      acc[voto.cadastroId] = (acc[voto.cadastroId] || 0) + 1;
      return acc;
    }, {});

    const caoMaisVotado = Object.entries(votosPorCao).sort(
      ([, a], [, b]) => b - a,
    )[0];

    const cao = votos.find((v) => v.cadastroId === caoMaisVotado[0])?.cadastro;

    return `${cao?.nome || 'Cão'} lidera com ${caoMaisVotado[1]} votos`;
  }

  private calcularTendenciaCao(votos: VotoComRelacoes[]): string {
    if (votos.length < 2) return 'ESTAVEL';

    const metade = Math.floor(votos.length / 2);
    const primeiraMetade = votos.slice(0, metade).length;
    const segundaMetade = votos.slice(metade).length;

    if (segundaMetade > primeiraMetade * 1.2) return 'CRESCENTE';
    if (segundaMetade < primeiraMetade * 0.8) return 'DECRESCENTE';
    return 'ESTAVEL';
  }

  private identificarPicos(tendencia: TendenciaDiaria[]): TendenciaDiaria[] {
    // Implementar identificação de picos na tendência
    return [];
  }

  private calcularTaxaCrescimento(tendencia: TendenciaDiaria[]): string {
    if (tendencia.length < 2) return '0';

    const primeiro = tendencia[0].votos;
    const ultimo = tendencia[tendencia.length - 1].votos;

    return primeiro > 0
      ? (((ultimo - primeiro) / primeiro) * 100).toFixed(2)
      : '0';
  }

  private analisarDistribuicaoTemporal(
    votos: VotoComRelacoes[],
  ): Record<string, number> {
    const distribuicao = votos.reduce((acc: Record<string, number>, voto) => {
      const hora = new Date(voto.createdAt).getHours();
      const periodo =
        hora < 6
          ? 'MADRUGADA'
          : hora < 12
            ? 'MANHA'
            : hora < 18
              ? 'TARDE'
              : 'NOITE';
      acc[periodo] = (acc[periodo] || 0) + 1;
      return acc;
    }, {});

    return distribuicao;
  }

  // Método para gerar PDF (placeholder - requer biblioteca como puppeteer)
  async gerarPDF(relatorio: any) {
    // Implementar geração de PDF usando puppeteer ou similar
    return {
      filename: `relatorio_votacao_${new Date().toISOString().split('T')[0]}.pdf`,
      contentType: 'application/pdf',
      // buffer: pdfBuffer
    };
  }
}
