import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  private _calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
  }

  async getDashboardCards() {
    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const endOfCurrentMonth = endOfMonth(now);
    const startOfPreviousMonth = startOfMonth(subMonths(now, 1));
    const endOfPreviousMonth = endOfMonth(subMonths(now, 1));

    // Total de Usuários
    const totalUsuarios = await this.prisma.user.count();
    const novosUsuariosMesAtual = await this.prisma.user.count({
      where: { createdAt: { gte: startOfCurrentMonth, lte: endOfCurrentMonth } },
    });
    const novosUsuariosMesAnterior = await this.prisma.user.count({
      where: { createdAt: { gte: startOfPreviousMonth, lte: endOfPreviousMonth } },
    });
    const porcentagemUsuarios = this._calculatePercentageChange(novosUsuariosMesAtual, novosUsuariosMesAnterior);

    // Artigos Publicados
    const totalArtigosPublicados = await this.prisma.artigo.count({ where: { status: 'PUBLICADO' } });
    const artigosPublicadosMesAtual = await this.prisma.artigo.count({
      where: { status: 'PUBLICADO', dataPublicacao: { gte: startOfCurrentMonth, lte: endOfCurrentMonth } },
    });
    const artigosPublicadosMesAnterior = await this.prisma.artigo.count({
      where: { status: 'PUBLICADO', dataPublicacao: { gte: startOfPreviousMonth, lte: endOfPreviousMonth } },
    });
    const porcentagemArtigos = this._calculatePercentageChange(artigosPublicadosMesAtual, artigosPublicadosMesAnterior);

    // Assinantes Ativos
    const totalAssinantesAtivos = await this.prisma.user.count({
      where: { role: { in: ['ASSINANTE', 'DONO_PET_APROVADO_ASSINANTE'] } },
    });
    const novosAssinantesMesAtual = await this.prisma.user.count({
        where: {
            role: { in: ['ASSINANTE', 'DONO_PET_APROVADO_ASSINANTE'] },
            createdAt: { gte: startOfCurrentMonth, lte: endOfCurrentMonth },
        },
    });
    const novosAssinantesMesAnterior = await this.prisma.user.count({
        where: {
            role: { in: ['ASSINANTE', 'DONO_PET_APROVADO_ASSINANTE'] },
            createdAt: { gte: startOfPreviousMonth, lte: endOfPreviousMonth },
        },
    });
    const porcentagemAssinantes = this._calculatePercentageChange(novosAssinantesMesAtual, novosAssinantesMesAnterior);

    // Visualizações
    const totalVisualizacoes = await this.prisma.artigoView.count();
    const visualizacoesMesAtual = await this.prisma.artigoView.count({
      where: { createdAt: { gte: startOfCurrentMonth, lte: endOfCurrentMonth } },
    });
    const visualizacoesMesAnterior = await this.prisma.artigoView.count({
      where: { createdAt: { gte: startOfPreviousMonth, lte: endOfPreviousMonth } },
    });
    const porcentagemVisualizacoes = this._calculatePercentageChange(visualizacoesMesAtual, visualizacoesMesAnterior);

    return {
      totalUsuarios: { value: totalUsuarios, percentage: porcentagemUsuarios },
      artigosPublicados: { value: totalArtigosPublicados, percentage: porcentagemArtigos },
      assinantesAtivos: { value: totalAssinantesAtivos, percentage: porcentagemAssinantes },
      visualizacoes: { value: totalVisualizacoes, percentage: porcentagemVisualizacoes },
    };
  }

  async getMonthlyGrowth() {
    const monthlyGrowth = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = subMonths(now, i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);

      const userCount = await this.prisma.user.count({
        where: { createdAt: { gte: start, lte: end } },
      });

      monthlyGrowth.push({
        month: start.toLocaleString('default', { month: 'long' }),
        year: start.getFullYear(),
        count: userCount,
      });
    }

    return monthlyGrowth;
  }

  async getUserDistribution() {
    const userDistribution = await this.prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true,
      },
    });

    return userDistribution.map((item) => ({
      role: item.role,
      count: item._count.role,
    }));
  }
}
