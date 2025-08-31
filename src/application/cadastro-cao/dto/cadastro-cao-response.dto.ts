import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SexoCao, VideoOption } from '@prisma/client';

export class CadastroCaoResponseDto {
  @ApiProperty({ description: 'ID único do cadastro' })
  cadastroId: string;

  @ApiProperty({ description: 'ID do usuário proprietário do cão' })
  userId: string;

  @ApiProperty({ description: 'Nome do cão' })
  nome: string;

  @ApiPropertyOptional({ description: 'Raça do cão' })
  raca?: string;

  @ApiProperty({ description: 'Sexo do cão', enum: SexoCao })
  sexo: SexoCao;

  @ApiProperty({ description: 'Data de nascimento do cão' })
  dataNascimento: Date;

  @ApiProperty({ description: 'URL da foto de perfil do cão' })
  fotoPerfil: string;

  @ApiProperty({ description: 'URL da foto lateral do cão' })
  fotoLateral: string;

  @ApiPropertyOptional({ description: 'Peso do cão' })
  peso?: string;

  @ApiPropertyOptional({ description: 'Altura do cão' })
  altura?: string;

  @ApiProperty({ description: 'Se o cão tem pedigree' })
  temPedigree: boolean;

  @ApiPropertyOptional({ description: 'Número de registro do pedigree' })
  registroPedigree?: string;

  @ApiPropertyOptional({ description: 'URL do arquivo do pedigree (frente)' })
  pedigreeFrente?: string;

  @ApiPropertyOptional({ description: 'URL do arquivo do pedigree (verso)' })
  pedigreeVerso?: string;

  @ApiProperty({ description: 'Se o cão tem microchip' })
  temMicrochip: boolean;

  @ApiPropertyOptional({ description: 'Número do microchip' })
  numeroMicrochip?: string;

  @ApiPropertyOptional({ description: 'Títulos e conquistas do cão' })
  titulos?: string;

  @ApiPropertyOptional({ description: 'Características especiais do cão' })
  caracteristicas?: string;

  @ApiProperty({ description: 'Opção de vídeo', enum: VideoOption })
  videoOption: VideoOption;

  @ApiPropertyOptional({ description: 'URL do vídeo' })
  videoUrl?: string;

  @ApiPropertyOptional({ description: 'Contato WhatsApp' })
  whatsappContato?: string;

  @ApiPropertyOptional({ description: 'Observações adicionais' })
  observacoes?: string;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de última atualização' })
  updatedAt: Date;
}
