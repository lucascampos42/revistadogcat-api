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
import { Transform } from 'class-transformer';

export class CreateCadastroCaoDto {
  // Dados do proprietário (condicionais)
  @ApiPropertyOptional({
    description: 'Se o proprietário é diferente do usuário logado',
    default: false
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  proprietarioDiferente?: boolean;

  @ApiPropertyOptional({
    description: 'Nome do proprietário (obrigatório se proprietarioDiferente = true)',
    example: 'João Silva'
  })
  @ValidateIf(o => o.proprietarioDiferente === true)
  @IsNotEmpty()
  @IsString()
  nomeProprietario?: string;

  @ApiPropertyOptional({
    description: 'CPF do proprietário (obrigatório se proprietarioDiferente = true)',
    example: '12345678901'
  })
  @ValidateIf(o => o.proprietarioDiferente === true)
  @IsNotEmpty()
  @IsString()
  cpfProprietario?: string;

  @ApiPropertyOptional({
    description: 'Email do proprietário (obrigatório se proprietarioDiferente = true)',
    example: 'joao@email.com'
  })
  @ValidateIf(o => o.proprietarioDiferente === true)
  @IsNotEmpty()
  @IsString()
  emailProprietario?: string;

  @ApiPropertyOptional({
    description: 'Telefone do proprietário (obrigatório se proprietarioDiferente = true)',
    example: '(11) 99999-9999'
  })
  @ValidateIf(o => o.proprietarioDiferente === true)
  @IsNotEmpty()
  @IsString()
  telefoneProprietario?: string;

  @ApiPropertyOptional({
    description: 'Endereço do proprietário (obrigatório se proprietarioDiferente = true)',
    example: 'Rua das Flores, 123'
  })
  @ValidateIf(o => o.proprietarioDiferente === true)
  @IsNotEmpty()
  @IsString()
  enderecoProprietario?: string;

  @ApiPropertyOptional({
    description: 'Cidade do proprietário (obrigatório se proprietarioDiferente = true)',
    example: 'São Paulo'
  })
  @ValidateIf(o => o.proprietarioDiferente === true)
  @IsNotEmpty()
  @IsString()
  cidade?: string;

  @ApiPropertyOptional({
    description: 'Estado do proprietário (obrigatório se proprietarioDiferente = true)',
    example: 'SP'
  })
  @ValidateIf(o => o.proprietarioDiferente === true)
  @IsNotEmpty()
  @IsString()
  estado?: string;

  // Dados do cão (obrigatórios)
  @ApiProperty({
    description: 'Nome do cão',
    example: 'Rex'
  })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({
    description: 'Raça do cão',
    example: 'Golden Retriever'
  })
  @IsString()
  @IsNotEmpty()
  raca: string;

  @ApiProperty({
    description: 'Sexo do cão',
    enum: SexoCao
  })
  @IsEnum(SexoCao)
  sexo: SexoCao;

  @ApiProperty({
    description: 'Data de nascimento do cão',
    example: '2020-05-15'
  })
  @IsDateString()
  dataNascimento: string;

  @ApiProperty({
    description: 'URL da foto de perfil do cão',
    example: 'https://example.com/uploads/caes/perfil-123.jpg'
  })
  @IsString()
  @IsNotEmpty()
  fotoPerfil: string;

  @ApiProperty({
    description: 'URL da foto lateral do cão',
    example: 'https://example.com/uploads/caes/lateral-123.jpg'
  })
  @IsString()
  @IsNotEmpty()
  fotoLateral: string;

  @ApiPropertyOptional({
    description: 'Peso do cão',
    example: '25kg'
  })
  @IsOptional()
  @IsString()
  peso?: string;

  @ApiPropertyOptional({
    description: 'Altura do cão',
    example: '60cm'
  })
  @IsOptional()
  @IsString()
  altura?: string;

  // Pedigree (condicional)
  @ApiPropertyOptional({
    description: 'Se o cão tem pedigree',
    default: false
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  temPedigree?: boolean;

  @ApiPropertyOptional({
    description: 'Número de registro do pedigree (obrigatório se temPedigree = true)',
    example: 'CBKC123456'
  })
  @ValidateIf(o => o.temPedigree === true)
  @IsNotEmpty()
  @IsString()
  registroPedigree?: string;

  @ApiPropertyOptional({
    description: 'URL do arquivo do pedigree (frente) (obrigatório se temPedigree = true)',
    example: 'https://example.com/uploads/pedigrees/frente-123.pdf'
  })
  @ValidateIf(o => o.temPedigree === true)
  @IsNotEmpty()
  @IsString()
  pedigreeFrente?: string;

  @ApiPropertyOptional({
    description: 'URL do arquivo do pedigree (verso) (obrigatório se temPedigree = true)',
    example: 'https://example.com/uploads/pedigrees/verso-123.pdf'
  })
  @ValidateIf(o => o.temPedigree === true)
  @IsNotEmpty()
  @IsString()
  pedigreeVerso?: string;

  // Microchip (condicional)
  @ApiPropertyOptional({
    description: 'Se o cão tem microchip',
    default: false
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  temMicrochip?: boolean;

  @ApiPropertyOptional({
    description: 'Número do microchip (obrigatório se temMicrochip = true)',
    example: '123456789012345'
  })
  @ValidateIf(o => o.temMicrochip === true)
  @IsNotEmpty()
  @IsString()
  numeroMicrochip?: string;

  // Informações adicionais
  @ApiPropertyOptional({
    description: 'Títulos e conquistas do cão',
    example: 'Campeão Nacional 2023'
  })
  @IsOptional()
  @IsString()
  titulos?: string;

  @ApiPropertyOptional({
    description: 'Características especiais do cão',
    example: 'Muito dócil e brincalhão'
  })
  @IsOptional()
  @IsString()
  caracteristicas?: string;

  // Vídeo (opcional)
  @ApiPropertyOptional({
    description: 'Opção de vídeo',
    enum: VideoOption,
    default: VideoOption.NONE
  })
  @IsOptional()
  @IsEnum(VideoOption)
  videoOption?: VideoOption;

  @ApiPropertyOptional({
    description: 'URL do vídeo (obrigatório se videoOption = UPLOAD ou URL)',
    example: 'https://example.com/uploads/videos/cao-123.mp4'
  })
  @ValidateIf(o => o.videoOption === VideoOption.UPLOAD || o.videoOption === VideoOption.URL)
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiPropertyOptional({
    description: 'Contato WhatsApp (obrigatório se videoOption = WHATSAPP)',
    example: '(11) 99999-9999'
  })
  @ValidateIf(o => o.videoOption === VideoOption.WHATSAPP)
  @IsOptional()
  @IsString()
  whatsappContato?: string;

  @ApiPropertyOptional({
    description: 'Observações adicionais',
    example: 'Cão muito sociável, ideal para famílias'
  })
  @IsOptional()
  @IsString()
  observacoes?: string;
}