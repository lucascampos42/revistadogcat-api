import { TipoEndereco } from '@prisma/client';

export class EnderecoEntity {
  enderecoId: string;
  userId: string;
  tipo: TipoEndereco;
  nome?: string | null;
  logradouro: string;
  numero: string;
  complemento?: string | null;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  pontoReferencia?: string | null;
  principal: boolean;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<EnderecoEntity>) {
    Object.assign(this, partial);
  }
}