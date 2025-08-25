import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  Length,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoEndereco } from '@prisma/client';

export class CreateEnderecoDto {
  @ApiProperty({
    description: 'Tipo do endereço',
    enum: TipoEndereco,
    example: TipoEndereco.RESIDENCIAL,
  })
  @IsEnum(TipoEndereco, {
    message: 'Tipo deve ser um dos valores válidos: RESIDENCIAL, COMERCIAL, ENTREGA, COBRANCA, TEMPORARIO, OUTRO',
  })
  tipo: TipoEndereco;

  @ApiPropertyOptional({
    description: 'Nome/apelido do endereço',
    example: 'Casa',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'Nome deve ser uma string' })
  @Length(1, 100, { message: 'Nome deve ter entre 1 e 100 caracteres' })
  nome?: string;

  @ApiProperty({
    description: 'Logradouro (rua, avenida, etc.)',
    example: 'Rua das Flores',
    maxLength: 200,
  })
  @IsString({ message: 'Logradouro deve ser uma string' })
  @Length(1, 200, { message: 'Logradouro deve ter entre 1 e 200 caracteres' })
  logradouro: string;

  @ApiProperty({
    description: 'Número do endereço',
    example: '123',
    maxLength: 20,
  })
  @IsString({ message: 'Número deve ser uma string' })
  @Length(1, 20, { message: 'Número deve ter entre 1 e 20 caracteres' })
  numero: string;

  @ApiPropertyOptional({
    description: 'Complemento (apartamento, bloco, etc.)',
    example: 'Apto 45',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'Complemento deve ser uma string' })
  @Length(1, 100, { message: 'Complemento deve ter entre 1 e 100 caracteres' })
  complemento?: string;

  @ApiProperty({
    description: 'Bairro',
    example: 'Centro',
    maxLength: 100,
  })
  @IsString({ message: 'Bairro deve ser uma string' })
  @Length(1, 100, { message: 'Bairro deve ter entre 1 e 100 caracteres' })
  bairro: string;

  @ApiProperty({
    description: 'Cidade',
    example: 'São Paulo',
    maxLength: 100,
  })
  @IsString({ message: 'Cidade deve ser uma string' })
  @Length(1, 100, { message: 'Cidade deve ter entre 1 e 100 caracteres' })
  cidade: string;

  @ApiProperty({
    description: 'Estado (UF)',
    example: 'SP',
    minLength: 2,
    maxLength: 2,
  })
  @IsString({ message: 'Estado deve ser uma string' })
  @Length(2, 2, { message: 'Estado deve ter exatamente 2 caracteres' })
  @Matches(/^[A-Z]{2}$/, {
    message: 'Estado deve ser uma UF válida (ex: SP, RJ, MG)',
  })
  estado: string;

  @ApiProperty({
    description: 'CEP no formato 00000-000',
    example: '01234-567',
  })
  @IsString({ message: 'CEP deve ser uma string' })
  @Matches(/^\d{5}-\d{3}$/, {
    message: 'CEP deve estar no formato 00000-000',
  })
  cep: string;

  @ApiPropertyOptional({
    description: 'Ponto de referência próximo',
    example: 'Próximo ao shopping',
    maxLength: 200,
  })
  @IsOptional()
  @IsString({ message: 'Ponto de referência deve ser uma string' })
  @Length(1, 200, { message: 'Ponto de referência deve ter entre 1 e 200 caracteres' })
  pontoReferencia?: string;

  @ApiPropertyOptional({
    description: 'Indica se é o endereço principal do usuário',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Principal deve ser um valor booleano' })
  principal?: boolean;
}