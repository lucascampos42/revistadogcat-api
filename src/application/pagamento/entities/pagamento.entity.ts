export class PagamentoEntity {
  pagamentoId: string;
  cadastroId: string;
  userId: string;
  valor: number;
  orderNsu: string;
  status: 'PENDENTE' | 'PAGO' | 'CANCELADO' | 'EXPIRADO';
  linkPagamento: string | null;
  transactionId: string | null;
  comprovante: string | null;
  createdAt: Date;
  updatedAt: Date;
  paidAt: Date | null;
}
