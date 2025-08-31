import { ApiProperty } from '@nestjs/swagger';
import { TipoEndereco } from '@prisma/client';

export class EnderecoResponseDto {
  @ApiProperty({ description: 'ID único do endereço' })
  enderecoId: string;

  @ApiProperty({ description: 'CEP do endereço' })
  cep: string;

  @ApiProperty({ description: 'Logradouro (rua, avenida, etc.)' })
  logradouro: string;

  @ApiProperty({ description: 'Número do endereço' })
  numero: string;

  @ApiProperty({ description: 'Nome do endereço', required: false })
  nome?: string | null;

  @ApiProperty({ description: 'Complemento do endereço', required: false })
  complemento?: string | null;

  @ApiProperty({ description: 'Bairro do endereço' })
  bairro: string;

  @ApiProperty({ description: 'Cidade do endereço' })
  cidade: string;

  @ApiProperty({ description: 'Estado do endereço (sigla)' })
  estado: string;

  @ApiProperty({ description: 'Ponto de referência', required: false })
  pontoReferencia?: string | null;

  @ApiProperty({ description: 'Tipo do endereço', enum: TipoEndereco })
  tipo: TipoEndereco;

  @ApiProperty({ description: 'Se é o endereço principal do usuário' })
  principal: boolean;

  @ApiProperty({ description: 'Se o endereço está ativo' })
  ativo: boolean;

  @ApiProperty({ description: 'Data de criação do endereço' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização' })
  updatedAt: Date;

  @ApiProperty({ description: 'ID do usuário proprietário' })
  userId: string;
}