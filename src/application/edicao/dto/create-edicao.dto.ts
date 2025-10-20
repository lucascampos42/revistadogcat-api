import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsOptional, 
  IsString, 
  IsDateString, 
  Length, 
  Matches,
  IsNotEmpty,
  MaxLength 
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateEdicaoDto {
  @ApiPropertyOptional({
    description: 'ID da edição (opcional). Se não enviado, será gerado automaticamente',
    pattern: '^[a-zA-Z0-9_-]+$',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @Length(1, 50, { message: 'ID deve ter entre 1 e 50 caracteres' })
  @Matches(/^[a-zA-Z0-9_-]+$/, { 
    message: 'ID deve conter apenas letras, números, hífens e underscores' 
  })
  id?: string;

  @ApiProperty({ 
    description: 'Título da edição', 
    example: 'Edição de Outubro',
    minLength: 3,
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty({ message: 'Título é obrigatório' })
  @Length(3, 200, { message: 'Título deve ter entre 3 e 200 caracteres' })
  @Transform(({ value }) => value?.trim())
  titulo!: string;

  @ApiProperty({ 
    description: 'Descrição da edição', 
    example: 'Nesta edição, trazemos...',
    minLength: 10,
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty({ message: 'Descrição é obrigatória' })
  @Length(10, 1000, { message: 'Descrição deve ter entre 10 e 1000 caracteres' })
  @Transform(({ value }) => value?.trim())
  descricao!: string;

  @ApiPropertyOptional({ 
    description: 'Data da edição (padrão: data atual)', 
    example: '2025-10-20T00:00:00.000Z',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data deve estar no formato ISO 8601' })
  data?: Date;
}
