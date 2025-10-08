import { IsOptional, IsString, IsEnum, IsNumberString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SexoCao } from '@prisma/client';

export class ListCadastrosCaoDto {
  @ApiPropertyOptional({
    description: 'Página atual (padrão: 1)',
    example: '1',
  })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiPropertyOptional({
    description: 'Itens por página (padrão: 10, máximo: 50)',
    example: '10',
  })
  @IsOptional()
  @IsNumberString()
  limit?: string;

  @ApiPropertyOptional({
    description: 'Buscar por nome do cão',
    example: 'Rex',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por raça',
    example: 'Golden Retriever',
  })
  @IsOptional()
  @IsString()
  raca?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por sexo',
    enum: SexoCao,
  })
  @IsOptional()
  @IsEnum(SexoCao)
  sexo?: SexoCao;

  @ApiPropertyOptional({
    description: 'Filtrar por cidade',
    example: 'São Paulo',
  })
  @IsOptional()
  @IsString()
  cidade?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por estado',
    example: 'SP',
  })
  @IsOptional()
  @IsString()
  estado?: string;

  @ApiPropertyOptional({
    description: 'Ordenar por campo (padrão: createdAt)',
    example: 'createdAt',
    enum: ['createdAt', 'nome', 'raca', 'dataNascimento'],
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Direção da ordenação (padrão: desc)',
    example: 'desc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}

export class CadastrosCaoListResponseDto {
  @ApiPropertyOptional({
    description: 'Lista de cadastros de cães',
    type: 'array',
  })
  data: any[];

  @ApiPropertyOptional({
    description: 'Informações de paginação',
  })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
