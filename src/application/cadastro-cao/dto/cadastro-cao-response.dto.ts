import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SexoCao, VideoOption } from '@prisma/client';

export class CadastroCaoResponseDto {
  @ApiProperty({
    description: 'ID único do cadastro',
    example: 'clx1234567890abcdef'
  })
  cadastroId: string;

  @ApiProperty({
    description: 'ID do usuário que fez o cadastro',
    example: 'clx0987654321fedcba'
  })
  userId: string;

  // Dados do proprietário
  @ApiProperty({
    description: 'Se o proprietário é diferente do usuário logado',
    example: false
  })
  proprietarioDiferente: boolean;

  @ApiPropertyOptional({
    description: 'Nome do proprietário',
    example: 'João Silva'
  })
  nomeProprietario?: string;

  @ApiPropertyOptional({
    description: 'CPF do proprietário',
    example: '12345678901'
  })
  cpfProprietario?: string;

  @ApiPropertyOptional({
    description: 'Email do proprietário',
    example: 'joao@email.com'
  })
  emailProprietario?: string;

  @ApiPropertyOptional({
    description: 'Telefone do proprietário',
    example: '(11) 99999-9999'
  })
  telefoneProprietario?: string;

  @ApiPropertyOptional({
    description: 'Endereço do proprietário',
    example: 'Rua das Flores, 123'
  })
  enderecoProprietario?: string;

  @ApiPropertyOptional({
    description: 'Cidade do proprietário',
    example: 'São Paulo'
  })
  cidade?: string;

  @ApiPropertyOptional({
    description: 'Estado do proprietário',
    example: 'SP'
  })
  estado?: string;

  // Dados do cão
  @ApiProperty({
    description: 'Nome do cão',
    example: 'Rex'
  })
  nome: string;

  @ApiProperty({
    description: 'Raça do cão',
    example: 'Golden Retriever'
  })
  raca: string;

  @ApiProperty({
    description: 'Sexo do cão',
    enum: SexoCao
  })
  sexo: SexoCao;

  @ApiProperty({
    description: 'Data de nascimento do cão',
    example: '2020-05-15T00:00:00Z'
  })
  dataNascimento: Date;

  @ApiProperty({
    description: 'URL da foto de perfil do cão',
    example: 'https://example.com/uploads/caes/perfil-123.jpg'
  })
  fotoPerfil: string;

  @ApiProperty({
    description: 'URL da foto lateral do cão',
    example: 'https://example.com/uploads/caes/lateral-123.jpg'
  })
  fotoLateral: string;

  @ApiPropertyOptional({
    description: 'Peso do cão',
    example: '25kg'
  })
  peso?: string;

  @ApiPropertyOptional({
    description: 'Altura do cão',
    example: '60cm'
  })
  altura?: string;

  // Pedigree
  @ApiProperty({
    description: 'Se o cão tem pedigree',
    example: false
  })
  temPedigree: boolean;

  @ApiPropertyOptional({
    description: 'Número de registro do pedigree',
    example: 'CBKC123456'
  })
  registroPedigree?: string;

  @ApiPropertyOptional({
    description: 'URL do arquivo do pedigree (frente)',
    example: 'https://example.com/uploads/pedigrees/frente-123.pdf'
  })
  pedigreeFrente?: string;

  @ApiPropertyOptional({
    description: 'URL do arquivo do pedigree (verso)',
    example: 'https://example.com/uploads/pedigrees/verso-123.pdf'
  })
  pedigreeVerso?: string;

  // Microchip
  @ApiProperty({
    description: 'Se o cão tem microchip',
    example: false
  })
  temMicrochip: boolean;

  @ApiPropertyOptional({
    description: 'Número do microchip',
    example: '123456789012345'
  })
  numeroMicrochip?: string;

  // Informações adicionais
  @ApiPropertyOptional({
    description: 'Títulos e conquistas do cão',
    example: 'Campeão Nacional 2023'
  })
  titulos?: string;

  @ApiPropertyOptional({
    description: 'Características especiais do cão',
    example: 'Muito dócil e brincalhão'
  })
  caracteristicas?: string;

  // Vídeo
  @ApiProperty({
    description: 'Opção de vídeo',
    enum: VideoOption
  })
  videoOption: VideoOption;

  @ApiPropertyOptional({
    description: 'URL do vídeo',
    example: 'https://example.com/uploads/videos/cao-123.mp4'
  })
  videoUrl?: string;

  @ApiPropertyOptional({
    description: 'Contato WhatsApp',
    example: '(11) 99999-9999'
  })
  whatsappContato?: string;

  @ApiPropertyOptional({
    description: 'Observações adicionais',
    example: 'Cão muito sociável, ideal para famílias'
  })
  observacoes?: string;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-15T08:00:00Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data de última atualização',
    example: '2024-01-15T10:30:00Z'
  })
  updatedAt: Date;
}