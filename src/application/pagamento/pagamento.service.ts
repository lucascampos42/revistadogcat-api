import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PagamentoRepository } from './repositories/pagamento.repository';
import { PagamentoResponseDto } from './dto/pagamento-response.dto';
import { PagamentoEntity } from './entities/pagamento.entity';
import { CadastroCaoRepository } from '../cadastro-cao/repositories/cadastro-cao.repository';
import { PrismaService } from '../../core/config/prisma.service';

@Injectable()
export class PagamentoService {
  constructor(
    private readonly pagamentoRepository: PagamentoRepository,
    private readonly cadastroCaoRepository: CadastroCaoRepository,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async criarLinkPagamento(
    cadastroId: string,
    userId: string,
  ): Promise<PagamentoResponseDto> {
    // Verificar se cadastro existe e pertence ao usuário
    const cadastro = await this.cadastroCaoRepository.findById(cadastroId);
    if (!cadastro) {
      throw new NotFoundException('Cadastro de cão não encontrado');
    }

    if (cadastro.userId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para criar pagamento para este cadastro',
      );
    }

    // Verificar se já existe pagamento para este cadastro
    const pagamentoExistente =
      await this.pagamentoRepository.findByCadastroId(cadastroId);
    if (pagamentoExistente) {
      return this.mapToResponseDto(pagamentoExistente);
    }

    // Buscar valor da taxa de cadastro na configuração
    const valorConfig = await this.prisma.configuracao.findUnique({
      where: { chave: 'TAXA_CADASTRO_CAO' },
    });

    if (!valorConfig) {
      throw new BadRequestException(
        'Taxa de cadastro não configurada no sistema',
      );
    }

    const valor = parseInt(valorConfig.valor, 10);
    if (isNaN(valor) || valor <= 0) {
      throw new BadRequestException('Valor de taxa inválido');
    }

    // Gerar NSU único
    const orderNsu = `CAO-${cadastroId.substring(0, 8)}-${Date.now()}`;

    // Obter configurações da InfinitePay
    const handle = this.configService.get<string>('INFINITEPAY_HANDLE');
    const checkoutUrl = this.configService.get<string>(
      'INFINITEPAY_CHECKOUT_URL',
    );
    const redirectUrl = this.configService.get<string>(
      'INFINITEPAY_REDIRECT_URL',
    );

    if (!handle || !checkoutUrl || !redirectUrl) {
      throw new BadRequestException(
        'Configuração da InfinitePay incompleta',
      );
    }

    // Montar link de pagamento
    const items = [
      {
        name: `Cadastro - ${cadastro.nome}`,
        price: valor,
        quantity: 1,
      },
    ];

    const params = new URLSearchParams({
      items: JSON.stringify(items),
      order_nsu: orderNsu,
      redirect_url: redirectUrl,
    });

    const linkPagamento = `${checkoutUrl}/${handle}?${params.toString()}`;

    // Criar registro de pagamento
    const pagamento = await this.pagamentoRepository.create(
      cadastroId,
      userId,
      valor,
      orderNsu,
      linkPagamento,
    );

    return this.mapToResponseDto(pagamento);
  }

  async buscarPorId(
    pagamentoId: string,
    userId: string,
  ): Promise<PagamentoResponseDto> {
    const pagamento = await this.pagamentoRepository.findById(pagamentoId);
    if (!pagamento) {
      throw new NotFoundException('Pagamento não encontrado');
    }
    if (pagamento.userId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para visualizar este pagamento',
      );
    }
    return this.mapToResponseDto(pagamento);
  }

  async buscarPorCadastro(
    cadastroId: string,
    userId: string,
  ): Promise<PagamentoResponseDto | null> {
    const pagamento =
      await this.pagamentoRepository.findByCadastroId(cadastroId);
    if (!pagamento) {
      return null;
    }
    if (pagamento.userId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para visualizar este pagamento',
      );
    }
    return this.mapToResponseDto(pagamento);
  }

  async listarPendentesPorUsuario(
    userId: string,
  ): Promise<PagamentoResponseDto[]> {
    const pagamentos =
      await this.pagamentoRepository.findPendentesByUserId(userId);
    return pagamentos.map((p) => this.mapToResponseDto(p));
  }

  async verificarPagamento(
    pagamentoId: string,
    userId: string,
  ): Promise<PagamentoResponseDto> {
    const pagamento = await this.pagamentoRepository.findById(pagamentoId);
    if (!pagamento) {
      throw new NotFoundException('Pagamento não encontrado');
    }
    if (pagamento.userId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para verificar este pagamento',
      );
    }

    // TODO: Implementar verificação via API da InfinitePay quando disponível
    // Por enquanto, apenas retorna o status atual

    return this.mapToResponseDto(pagamento);
  }

  async processarWebhook(data: any): Promise<void> {
    const { order_nsu, transaction_id, comprovante, status } = data;

    if (!order_nsu) {
      console.error('Webhook sem order_nsu:', data);
      throw new BadRequestException('order_nsu é obrigatório');
    }

    // Buscar pagamento pelo order_nsu
    const pagamento = await this.pagamentoRepository.findByOrderNsu(order_nsu);
    if (!pagamento) {
      console.error('Pagamento não encontrado para order_nsu:', order_nsu);
      throw new NotFoundException('Pagamento não encontrado');
    }

    // Se já foi pago, ignorar
    if (pagamento.status === 'PAGO') {
      console.log('Pagamento já processado:', order_nsu);
      return;
    }

    // Atualizar status do pagamento para PAGO
    await this.pagamentoRepository.updateStatus(
      pagamento.pagamentoId,
      'PAGO',
      transaction_id,
      comprovante,
    );

    // Atualizar status do cadastro para APROVADO
    await this.cadastroCaoRepository.updateStatus(
      pagamento.cadastroId,
      'APROVADO',
    );

    console.log('Pagamento processado com sucesso:', {
      orderNsu: order_nsu,
      transactionId: transaction_id,
      cadastroId: pagamento.cadastroId,
    });
  }

  async buscarPorOrderNsu(orderNsu: string): Promise<PagamentoResponseDto | null> {
    const pagamento = await this.pagamentoRepository.findByOrderNsu(orderNsu);
    if (!pagamento) {
      return null;
    }
    return this.mapToResponseDto(pagamento);
  }

  private mapToResponseDto(pagamento: PagamentoEntity): PagamentoResponseDto {
    return {
      pagamentoId: pagamento.pagamentoId,
      cadastroId: pagamento.cadastroId,
      userId: pagamento.userId,
      valor: pagamento.valor,
      orderNsu: pagamento.orderNsu,
      status: pagamento.status,
      linkPagamento: pagamento.linkPagamento ?? undefined,
      transactionId: pagamento.transactionId ?? undefined,
      comprovante: pagamento.comprovante ?? undefined,
      createdAt: pagamento.createdAt,
      updatedAt: pagamento.updatedAt,
      paidAt: pagamento.paidAt ?? undefined,
    };
  }
}
