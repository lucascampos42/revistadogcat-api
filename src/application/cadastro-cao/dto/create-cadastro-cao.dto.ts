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

  @ApiProperty({
    description:
      'ID da raça do cão. Deve ser um ID válido obtido do endpoint /racas.',
    example: 'clz987654321',
  })
  @IsString()
  @IsNotEmpty()
  racaId: string;

  @ApiProperty({ description: 'Sexo do cão', enum: SexoCao })
  @IsEnum(SexoCao)
  sexo: SexoCao;

  @ApiProperty({
    description: 'Data de nascimento do cão',
    example: '2020-05-15',
  })
  @IsDateString()
  dataNascimento: string;

  @ApiProperty({ description: 'URL da foto de perfil do cão' })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  fotoPerfil: string;

  @ApiProperty({ description: 'URL da foto lateral do cão' })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  fotoLateral: string;

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
  @IsBoolean()
  temPedigree?: boolean;

  @ApiPropertyOptional({ description: 'Número de registro do pedigree' })
  @ValidateIf((o) => o.temPedigree === true)
  @IsNotEmpty()
  @IsString()
  registroPedigree?: string;

  @ApiPropertyOptional({ description: 'URL do arquivo do pedigree (frente)' })
  @ValidateIf((o) => o.temPedigree === true)
  @IsNotEmpty()
  @IsUrl()
  pedigreeFrente?: string;

  @ApiPropertyOptional({ description: 'URL do arquivo do pedigree (verso)' })
  @ValidateIf((o) => o.temPedigree === true)
  @IsNotEmpty()
  @IsUrl()
  pedigreeVerso?: string;

  @ApiPropertyOptional({
    description: 'Se o cão tem microchip',
    default: false,
  })
  @IsOptional()
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

  @ApiPropertyOptional({ description: 'URL do vídeo' })
  @ValidateIf(
    (o) =>
      o.videoOption === VideoOption.UPLOAD || o.videoOption === VideoOption.URL,
  )
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
