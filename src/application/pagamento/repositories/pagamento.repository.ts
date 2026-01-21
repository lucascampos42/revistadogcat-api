import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/config/prisma.service';
import { PagamentoEntity } from '../entities/pagamento.entity';
import { StatusPagamento } from '@prisma/client';

@Injectable()
export class PagamentoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    cadastroId: string,
    userId: string,
    valor: number,
    orderNsu: string,
    linkPagamento: string,
  ): Promise<PagamentoEntity> {
    return this.prisma.pagamento.create({
      data: {
        cadastroId,
        userId,
        valor,
        orderNsu,
        linkPagamento,
        status: StatusPagamento.PENDENTE,
      },
    });
  }

  async findById(pagamentoId: string): Promise<PagamentoEntity | null> {
    return this.prisma.pagamento.findUnique({
      where: { pagamentoId },
    });
  }

  async findByCadastroId(cadastroId: string): Promise<PagamentoEntity | null> {
    return this.prisma.pagamento.findUnique({
      where: { cadastroId },
    });
  }

  async findByOrderNsu(orderNsu: string): Promise<PagamentoEntity | null> {
    return this.prisma.pagamento.findUnique({
      where: { orderNsu },
    });
  }

  async findPendentesByUserId(userId: string): Promise<PagamentoEntity[]> {
    return this.prisma.pagamento.findMany({
      where: {
        userId,
        status: StatusPagamento.PENDENTE,
      },
      include: {
        cadastro: {
          select: {
            nome: true,
            fotoPerfil: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateStatus(
    pagamentoId: string,
    status: StatusPagamento,
    transactionId?: string,
    comprovante?: string,
  ): Promise<PagamentoEntity> {
    return this.prisma.pagamento.update({
      where: { pagamentoId },
      data: {
        status,
        transactionId,
        comprovante,
        paidAt: status === StatusPagamento.PAGO ? new Date() : undefined,
      },
    });
  }
}
