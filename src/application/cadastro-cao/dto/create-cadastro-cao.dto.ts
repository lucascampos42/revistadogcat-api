import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsDateString,
  ValidateIf,
  IsUrl,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SexoCao, VideoOption } from '@prisma/client';

export class CreateCadastroCaoDto {
  @ApiPropertyOptional({
    description:
      'ID do usuário proprietário. Se omitido, o cão é associado ao usuário logado.',
    example: 'cly123abcde',
  })
  @IsOptional()
  @IsString()
  proprietarioId?: string;

  @ApiProperty({ description: 'Nome do cão', example: 'Rex' })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiPropertyOptional({
    description:
      'ID da raça do cão. Use este campo se a raça já existir. Não use junto com `racaSugerida`.',
    example: 'clz987654321',
  })
  @IsOptional()
  @IsString()
  racaId?: string;

  @ApiPropertyOptional({
    description:
      'Nome da nova raça sugerida. Use este campo se a raça não existir na lista. Não use junto com `racaId`.',
    example: 'Vira-lata Caramelo',
  })
  @IsOptional()
  @IsString()
  racaSugerida?: string;

  @ApiProperty({ description: 'Sexo do cão', enum: SexoCao })
  @IsEnum(SexoCao)
  sexo: SexoCao;

  @ApiProperty({
    description: 'Data de nascimento do cão',
    example: '2020-05-15',
  })
  @IsDateString()
  dataNascimento: string;

  @ApiPropertyOptional({ description: 'Peso do cão', example: '25kg' })
  @IsOptional()
  @IsString()
  peso?: string;

  @ApiPropertyOptional({ description: 'Altura do cão', example: '60cm' })
  @IsOptional()
  @IsString()
  altura?: string;

  @ApiPropertyOptional({ description: 'Se o cão tem pedigree', default: false })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const v = value.trim().toLowerCase();
      if (v === 'true') return true;
      if (v === 'false') return false;
    }
    return Boolean(value);
  })
  @IsBoolean()
  temPedigree?: boolean;

  @ApiPropertyOptional({ description: 'Número de registro do pedigree' })
  @ValidateIf((o) => o.temPedigree === true)
  @IsNotEmpty()
  @IsString()
  registroPedigree?: string;

  @ApiPropertyOptional({
    description: 'Se o cão tem microchip',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const v = value.trim().toLowerCase();
      if (v === 'true') return true;
      if (v === 'false') return false;
    }
    return Boolean(value);
  })
  @IsBoolean()
  temMicrochip?: boolean;

  @ApiPropertyOptional({ description: 'Número do microchip' })
  @ValidateIf((o) => o.temMicrochip === true)
  @IsNotEmpty()
  @IsString()
  numeroMicrochip?: string;

  @ApiPropertyOptional({ description: 'Títulos e conquistas do cão' })
  @IsOptional()
  @IsString()
  titulos?: string;

  @ApiPropertyOptional({ description: 'Características especiais do cão' })
  @IsOptional()
  @IsString()
  caracteristicas?: string;

  @ApiPropertyOptional({ enum: VideoOption, default: VideoOption.NONE })
  @IsOptional()
  @IsEnum(VideoOption)
  videoOption?: VideoOption;

  @ApiPropertyOptional({
    description: 'URL do vídeo (YouTube ou outra plataforma)',
  })
  @ValidateIf((o) => o.videoOption === VideoOption.URL)
  @IsOptional()
  @IsUrl()
  videoUrl?: string;

  @ApiPropertyOptional({ description: 'Contato WhatsApp' })
  @ValidateIf((o) => o.videoOption === VideoOption.WHATSAPP)
  @IsOptional()
  @IsString()
  whatsappContato?: string;

  @ApiPropertyOptional({ description: 'Observações adicionais' })
  @IsOptional()
  @IsString()
  observacoes?: string;
}
