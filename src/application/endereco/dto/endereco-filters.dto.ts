import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TipoEndereco } from '@prisma/client';
import { Transform } from 'class-transformer';

export class EnderecoFiltersDto {
  @ApiPropertyOptional({
    description: 'Filtrar por endereços ativos/inativos',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean({ message: 'Ativo deve ser um valor booleano' })
  ativo?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de endereço',
    enum: TipoEndereco,
    example: TipoEndereco.RESIDENCIAL,
  })
  @IsOptional()
  @IsEnum(TipoEndereco, {
    message: 'Tipo deve ser um dos valores válidos: RESIDENCIAL, COMERCIAL, ENTREGA, COBRANCA, TEMPORARIO, OUTRO',
  })
  tipo?: TipoEndereco;
}