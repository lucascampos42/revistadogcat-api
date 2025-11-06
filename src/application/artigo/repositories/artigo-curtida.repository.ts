import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/config/prisma.service';
import { CurtirArtigoDto } from '../dto/curtir-artigo.dto';

@Injectable()
export class ArtigoCurtidaRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Adiciona uma curtida a um artigo
   */
  async addCurtida(
    artigoId: string,
    curtidaData: CurtirArtigoDto,
  ): Promise<void> {
    await this.prisma.artigoCurtida.create({
      data: {
        artigoId,
        userId: curtidaData.userId,
        fingerprint: curtidaData.fingerprint,
        ip: curtidaData.ip,
        userAgent: curtidaData.userAgent,
      },
    });
  }

  /**
   * Remove uma curtida de um artigo
   */
  async removeCurtida(artigoId: string, fingerprint: string): Promise<void> {
    await this.prisma.artigoCurtida.deleteMany({
      where: {
        artigoId,
        fingerprint,
      },
    });
  }

  /**
   * Verifica se um fingerprint já curtiu o artigo
   */
  async hasCurtida(artigoId: string, fingerprint: string): Promise<boolean> {
    const count = await this.prisma.artigoCurtida.count({
      where: {
        artigoId,
        fingerprint,
      },
    });

    return count > 0;
  }

  /**
   * Conta o total de curtidas de um artigo
   */
  async countCurtidas(artigoId: string): Promise<number> {
    return await this.prisma.artigoCurtida.count({
      where: {
        artigoId,
      },
    });
  }

  /**
   * Toggle curtida - adiciona se não existe, remove se existe
   */
  async toggleCurtida(
    artigoId: string,
    curtidaData: CurtirArtigoDto,
  ): Promise<{ curtido: boolean; total: number }> {
    const exists = await this.hasCurtida(artigoId, curtidaData.fingerprint);

    if (exists) {
      await this.removeCurtida(artigoId, curtidaData.fingerprint);
    } else {
      await this.addCurtida(artigoId, curtidaData);
    }

    const total = await this.countCurtidas(artigoId);

    return {
      curtido: !exists,
      total,
    };
  }

  /**
   * Retorna lista de artigos mais curtidos
   */
  async getMostLiked(limit: number = 10): Promise<
    Array<{
      artigoId: string;
      totalCurtidas: number;
    }>
  > {
    const result = await this.prisma.artigoCurtida.groupBy({
      by: ['artigoId'],
      _count: {
        artigoId: true,
      },
      orderBy: {
        _count: {
          artigoId: 'desc',
        },
      },
      take: limit,
    });

    return result.map((item) => ({
      artigoId: item.artigoId,
      totalCurtidas: item._count.artigoId,
    }));
  }

  /**
   * Retorna estatísticas de curtidas por período
   */
  async getCurtidaStats(
    artigoId: string,
    days: number = 30,
  ): Promise<{
    total: number;
    daily: Array<{ date: string; count: number }>;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const curtidas = await this.prisma.artigoCurtida.findMany({
      where: {
        artigoId,
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
      },
    });

    const total = curtidas.length;

    // Agrupar por dia
    const dailyMap = new Map<string, number>();
    curtidas.forEach((curtida) => {
      const date = curtida.createdAt.toISOString().split('T')[0];
      dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
    });

    const daily = Array.from(dailyMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { total, daily };
  }
}
