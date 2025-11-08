import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { AcaoKardex, VotoTipo } from '@prisma/client';

export class CreateVotoDto {
  @ApiProperty({
    description: 'ID do cadastro do cão para votar',
    example: 'clxxx123456789',
  })
  @IsString()
  cadastroId: string;

  @ApiProperty({
    enum: VotoTipo,
    description: 'Tipo do voto (COMUM ou SUPER)',
    default: VotoTipo.COMUM,
  })
  @IsEnum(VotoTipo)
  tipo: VotoTipo = VotoTipo.COMUM;
}

export class VotoResponseDto {
  @ApiProperty({ description: 'ID do voto' })
  votoId: string;

  @ApiProperty({ description: 'ID do usuário que votou' })
  userId: string;

  @ApiProperty({ description: 'ID do cadastro votado' })
  cadastroId: string;

  @ApiProperty({ enum: VotoTipo, description: 'Tipo do voto' })
  tipo: VotoTipo;

  @ApiProperty({ description: 'Data do voto' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'IP do usuário' })
  ip?: string | null;
}

export class ListVotosDto {
  @ApiPropertyOptional({
    description: 'Página atual',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Itens por página',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'ID do usuário para filtrar votos',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: 'ID do cadastro para filtrar votos',
  })
  @IsOptional()
  @IsString()
  cadastroId?: string;

  @ApiPropertyOptional({
    enum: VotoTipo,
    description: 'Tipo do voto para filtrar',
  })
  @IsOptional()
  @IsEnum(VotoTipo)
  tipo?: VotoTipo;

  @ApiPropertyOptional({
    description: 'Data inicial para filtro (ISO string)',
  })
  @IsOptional()
  @IsDateString()
  dataInicial?: string;

  @ApiPropertyOptional({
    description: 'Data final para filtro (ISO string)',
  })
  @IsOptional()
  @IsDateString()
  dataFinal?: string;
}

export class VotosListResponseDto {
  @ApiProperty({ type: [VotoResponseDto] })
  votos: VotoResponseDto[];

  @ApiProperty({ description: 'Total de votos' })
  total: number;

  @ApiProperty({ description: 'Página atual' })
  page: number;

  @ApiProperty({ description: 'Itens por página' })
  limit: number;

  @ApiProperty({ description: 'Total de páginas' })
  totalPages: number;
}

export class KardexVotoDto {
  @ApiProperty({ description: 'ID do kardex' })
  kardexId: string;

  @ApiProperty({ description: 'ID do usuário' })
  userId: string;

  @ApiProperty({ description: 'ID do cadastro' })
  cadastroId: string;

  @ApiProperty({ enum: AcaoKardex, description: 'Ação realizada' })
  acao: AcaoKardex;

  @ApiPropertyOptional({
    enum: VotoTipo,
    description: 'Tipo do voto relacionado à ação',
  })
  tipo?: VotoTipo | null;

  @ApiProperty({ description: 'Data da ação' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'IP do usuário' })
  ip?: string | null;

  @ApiPropertyOptional({ description: 'User Agent' })
  userAgent?: string | null;

  @ApiPropertyOptional({ description: 'Observações sobre a ação' })
  observacoes?: string | null;
}

export class ListKardexDto {
  @ApiPropertyOptional({
    description: 'Página atual',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Itens por página',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'ID do usuário para filtrar',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: 'ID do cadastro para filtrar',
  })
  @IsOptional()
  @IsString()
  cadastroId?: string;

  @ApiPropertyOptional({
    enum: AcaoKardex,
    description: 'Tipo de ação para filtrar',
  })
  @IsOptional()
  @IsEnum(AcaoKardex)
  acao?: AcaoKardex;

  @ApiPropertyOptional({
    description: 'Data inicial para filtro (ISO string)',
  })
  @IsOptional()
  @IsDateString()
  dataInicial?: string;

  @ApiPropertyOptional({
    description: 'Data final para filtro (ISO string)',
  })
  @IsOptional()
  @IsDateString()
  dataFinal?: string;
}

export class KardexListResponseDto {
  @ApiProperty({ type: [KardexVotoDto] })
  kardex: KardexVotoDto[];

  @ApiProperty({ description: 'Total de registros' })
  total: number;

  @ApiProperty({ description: 'Página atual' })
  page: number;

  @ApiProperty({ description: 'Itens por página' })
  limit: number;

  @ApiProperty({ description: 'Total de páginas' })
  totalPages: number;
}

export class StatusVotacaoUsuarioDto {
  @ApiProperty({ description: 'Votos comuns disponíveis' })
  votosDisponiveisComum: number;

  @ApiProperty({ description: 'Votos comuns utilizados' })
  votosUtilizadosComum: number;

  @ApiProperty({ description: 'Votos super disponíveis' })
  votosDisponiveisSuper: number;

  @ApiProperty({ description: 'Votos super utilizados' })
  votosUtilizadosSuper: number;

  @ApiProperty({ description: 'Votos restantes (comum)' })
  votosRestantesComum: number;

  @ApiProperty({ description: 'Votos restantes (super)' })
  votosRestantesSuper: number;
}

export class EstatisticasVotacaoDto {
  @ApiProperty({ description: 'Total de votos registrados' })
  totalVotos: number;

  @ApiProperty({ description: 'Total de usuários que votaram' })
  totalUsuariosVotaram: number;

  @ApiProperty({ description: 'Total de cães com votos' })
  totalCaesComVotos: number;

  @ApiProperty({ description: 'Média de votos por cão' })
  mediaVotosPorCao: number;

  @ApiPropertyOptional({
    description: 'Cão mais votado',
    type: Object,
  })
  caoMaisVotado?: {
    cadastroId: string;
    nome: string;
    totalVotos: number;
  } | null;
}

export class ExportacaoVotosDto {
  @ApiPropertyOptional({
    description: 'Formato de exportação',
    enum: ['csv', 'pdf'],
    default: 'csv',
  })
  @IsOptional()
  @IsEnum(['csv', 'pdf'])
  formato?: 'csv' | 'pdf' = 'csv';

  @ApiPropertyOptional({
    description: 'Data inicial para filtro (ISO string)',
  })
  @IsOptional()
  @IsDateString()
  dataInicial?: string;

  @ApiPropertyOptional({
    description: 'Data final para filtro (ISO string)',
  })
  @IsOptional()
  @IsDateString()
  dataFinal?: string;

  @ApiPropertyOptional({
    description: 'ID do usuário para filtrar',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: 'ID do cadastro para filtrar',
  })
  @IsOptional()
  @IsString()
  cadastroId?: string;
}
