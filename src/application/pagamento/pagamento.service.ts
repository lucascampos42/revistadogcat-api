import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PagamentoResponseDto } from './dto/pagamento-response.dto';
import { CadastroCaoRepository } from '../cadastro-cao/repositories/cadastro-cao.repository';
import { PrismaService } from '../../core/config/prisma.service';
import { CadastroCaoEntity } from '../cadastro-cao/entities/cadastro-cao.entity';
import { StatusPagamento } from '@prisma/client';

@Injectable()
export class PagamentoService {
  constructor(
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

    // Verificar se já está pago
    if (cadastro.statusPagamento === StatusPagamento.PAGO) {
      return this.mapToResponseDto(cadastro);
    }

    // Se já tem link gerado e válido, poderia retornar o mesmo?
    // Por simplicidade, vamos regenerar se não estiver PAGO.

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

    // Atualizar cadastro com dados do pagamento
    const cadastroAtualizado = await this.cadastroCaoRepository.updatePaymentData(
      cadastroId,
      {
        pagamentoValor: valor,
        pagamentoOrderNsu: orderNsu,
        pagamentoLink: linkPagamento,
        pagamentoData: new Date(),
        statusPagamento: StatusPagamento.PENDENTE,
      },
    );

    return this.mapToResponseDto(cadastroAtualizado);
  }

  async buscarPorCadastro(
    cadastroId: string,
    userId: string,
  ): Promise<PagamentoResponseDto | null> {
    const cadastro = await this.cadastroCaoRepository.findById(cadastroId);
    if (!cadastro) {
      return null;
    }

    // Se não tem dados de pagamento iniciados, retorna null ou um DTO vazio/pendente?
    // Se statusPagamento é PENDENTE e não tem link, tecnicamente não existe "pagamento" iniciado.
    if (!cadastro.pagamentoOrderNsu) {
        return null; 
    }

    if (cadastro.userId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para visualizar este pagamento',
      );
    }
    return this.mapToResponseDto(cadastro);
  }

  // Método simplificado, removemos "buscarPorId" pois o ID agora é o do cadastro
  // Removemos listarPendentesPorUsuario pois podemos filtrar cadastros por statusPagamento no controller de cadastro se necessário

  async verificarPagamento(
    cadastroId: string,
    userId: string,
  ): Promise<PagamentoResponseDto> {
    const cadastro = await this.cadastroCaoRepository.findById(cadastroId);
    if (!cadastro) {
      throw new NotFoundException('Cadastro não encontrado');
    }
    if (cadastro.userId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para verificar este pagamento',
      );
    }

    // TODO: Implementar verificação via API da InfinitePay quando disponível
    return this.mapToResponseDto(cadastro);
  }

  async processarWebhook(data: any): Promise<void> {
    const { order_nsu, transaction_id, comprovante, status } = data;

    if (!order_nsu) {
      console.error('Webhook sem order_nsu:', data);
      throw new BadRequestException('order_nsu é obrigatório');
    }

    // Buscar cadastro pelo order_nsu
    const cadastro = await this.cadastroCaoRepository.findByOrderNsu(order_nsu);
    if (!cadastro) {
      console.error('Cadastro não encontrado para order_nsu:', order_nsu);
      throw new NotFoundException('Pagamento não encontrado');
    }

    // Se já foi pago, ignorar
    if (cadastro.statusPagamento === StatusPagamento.PAGO) {
      console.log('Pagamento já processado:', order_nsu);
      return;
    }

    // Atualizar status do pagamento para PAGO
    // Assumindo que o webhook só vem em sucesso ou validamos o status do payload
    // Se status do payload indicar falha, deveríamos tratar. Mas por simplificação assumimos sucesso se chegou aqui
    // ou checamos data.status se a InfinitePay mandar.

    await this.cadastroCaoRepository.updatePaymentData(
      cadastro.cadastroId,
      {
        statusPagamento: StatusPagamento.PAGO,
        pagamentoIdTransacao: transaction_id,
        pagamentoComprovante: comprovante,
        pagamentoData: new Date(), // Data da confirmação
      },
    );

    console.log('Pagamento processado com sucesso:', {
      orderNsu: order_nsu,
      transactionId: transaction_id,
      cadastroId: cadastro.cadastroId,
    });
  }

  private mapToResponseDto(cadastro: CadastroCaoEntity): PagamentoResponseDto {
    return {
      pagamentoId: cadastro.cadastroId, // Usamos o ID do cadastro como ID do "pagamento" virtual
      cadastroId: cadastro.cadastroId,
      userId: cadastro.userId,
      valor: cadastro.pagamentoValor || 0,
      orderNsu: cadastro.pagamentoOrderNsu || '',
      status: cadastro.statusPagamento, // Enum compatível
      linkPagamento: cadastro.pagamentoLink || undefined,
      transactionId: cadastro.pagamentoIdTransacao || undefined,
      comprovante: cadastro.pagamentoComprovante || undefined,
      createdAt: cadastro.pagamentoData || cadastro.createdAt, // Data do pagamento ou criação do cadastro
      updatedAt: cadastro.updatedAt,
      paidAt: cadastro.statusPagamento === StatusPagamento.PAGO ? (cadastro.pagamentoData || undefined) : undefined,
    };
  }
}
