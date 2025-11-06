import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/config/prisma.service';
import { ViewArtigoDto } from '../dto/view-artigo.dto';

@Injectable()
export class ArtigoViewRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra uma nova visualização de artigo
   */
  async createView(artigoId: string, viewData: ViewArtigoDto): Promise<void> {
    await this.prisma.artigoView.create({
      data: {
        artigoId,
        userId: viewData.userId,
        fingerprint: viewData.fingerprint,
        ip: viewData.ip,
        userAgent: viewData.userAgent,
      },
    });
  }
  async hasRecentView(artigoId: string, fingerprint: string): Promise<boolean> {
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    const count = await this.prisma.artigoView.count({
      where: {
        artigoId,
        fingerprint,
        createdAt: {
          gte: oneDayAgo,
        },
      },
    });

    return count > 0;
  }

 
  async countUniqueViews(artigoId: string): Promise<number> {
    const result = await this.prisma.artigoView.groupBy({
      by: ['fingerprint'],
      where: {
        artigoId,
      },
      _count: {
        fingerprint: true,
      },
    });

    return result.length;
  }

  /**
   * Conta o total de visualizações de um artigo (incluindo repetidas)
   */
  async countTotalViews(artigoId: string): Promise<number> {
    return await this.prisma.artigoView.count({
      where: {
        artigoId,
      },
    });
  }

  /**
   * Retorna estatísticas de visualizações por período
   */
  async getViewStats(
    artigoId: string,
    days: number = 30,
  ): Promise<{
    total: number;
    unique: number;
    daily: Array<{ date: string; count: number }>;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const views = await this.prisma.artigoView.findMany({
      where: {
        artigoId,
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        fingerprint: true,
        createdAt: true,
      },
    });

    const total = views.length;
    const uniqueFingerprints = new Set(views.map((v) => v.fingerprint));
    const unique = uniqueFingerprints.size;

    // Agrupar por dia
    const dailyMap = new Map<string, number>();
    views.forEach((view) => {
      const date = view.createdAt.toISOString().split('T')[0];
      dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
    });

    const daily = Array.from(dailyMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { total, unique, daily };
  }
}
