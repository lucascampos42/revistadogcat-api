import {
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
  IsNumberString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { StatusArtigo } from '@prisma/client';
import { Transform } from 'class-transformer';

export class ListArtigosDto {
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
    description: 'Buscar por título ou conteúdo',
    example: 'cuidados com cão',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por categoria',
    example: 'Saúde',
  })
  @IsOptional()
  @IsString()
  categoria?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por status',
    enum: StatusArtigo,
  })
  @IsOptional()
  @IsEnum(StatusArtigo)
  status?: StatusArtigo;

  @ApiPropertyOptional({
    description: 'Filtrar apenas artigos em destaque',
    example: 'true',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  destaque?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrar por tag',
    example: 'saúde',
  })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({
    description: 'Ordenar por campo (padrão: dataPublicacao)',
    example: 'dataPublicacao',
    enum: [
      'dataPublicacao',
      'visualizacoes',
      'curtidas',
      'createdAt',
      'titulo',
    ],
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

export class ArtigosListResponseDto {
  @ApiPropertyOptional({
    description: 'Lista de artigos',
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
