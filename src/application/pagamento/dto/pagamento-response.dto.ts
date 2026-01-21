export class PagamentoResponseDto {
  pagamentoId: string;
  cadastroId: string;
  userId: string;
  valor: number;
  orderNsu: string;
  status: 'PENDENTE' | 'PAGO' | 'CANCELADO' | 'EXPIRADO';
  linkPagamento?: string;
  transactionId?: string;
  comprovante?: string;
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date;
}
