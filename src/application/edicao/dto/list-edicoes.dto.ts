import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class ListEdicoesDto {
  @ApiPropertyOptional({ description: 'Filtrar por ano', example: 2025 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  ano?: number;

  @ApiPropertyOptional({ description: 'Página (padrão: 1)', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Limite por página (padrão: 12)',
    example: 12,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number = 12;
}
