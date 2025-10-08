import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';

export class CreateEdicaoDto {
  @ApiPropertyOptional({
    description:
      'ID da edição (opcional). Se não enviado, será gerado a partir de ano+bimestre',
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ description: 'Título da edição', example: 'Edição Mar/Abr' })
  @IsString()
  titulo!: string;

  @ApiProperty({ description: 'Bimestre da edição', example: 'Mar/Abr' })
  @IsString()
  bimestre!: string;

  @ApiProperty({ description: 'Ano da edição', example: 2025 })
  @IsInt()
  @Min(2000)
  @Max(new Date().getFullYear())
  ano!: number;
}
