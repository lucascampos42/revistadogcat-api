import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateEdicaoDto {
  @ApiPropertyOptional({
    description:
      'ID da edição (opcional). Se não enviado, será gerado automaticamente',
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ description: 'Título da edição', example: 'Edição de Outubro' })
  @IsString()
  titulo!: string;

  @ApiProperty({ description: 'Descrição da edição', example: 'Nesta edição, trazemos...' })
  @IsString()
  descricao!: string;

  @ApiPropertyOptional({ description: 'Data da edição (padrão: data atual)', example: '2025-10-20' })
  @IsOptional()
  @IsDateString()
  data?: Date;
}
