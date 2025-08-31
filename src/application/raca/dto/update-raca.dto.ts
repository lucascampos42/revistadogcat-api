import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, IsBoolean } from 'class-validator';

export class UpdateRacaDto {
  @ApiPropertyOptional({
    description: 'Novo nome da raça',
    example: 'Golden Retriever Brasileiro',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  nome?: string;

  @ApiPropertyOptional({
    description: 'Status da raça (true para ativo, false para inativo)',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
