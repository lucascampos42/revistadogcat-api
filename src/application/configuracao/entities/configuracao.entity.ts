export class ConfiguracaoEntity {
  configuracaoId: string;
  chave: string;
  valor: string;
  descricao: string | null;
  createdAt: Date;
  updatedAt: Date;
}
