import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatusArtigo } from '@prisma/client';

export class ArtigoResponseDto {
  @ApiProperty({
    description: 'ID único do artigo',
    example: 'clx1234567890abcdef'
  })
  artigoId: string;

  @ApiProperty({
    description: 'Título do artigo',
    example: 'Como cuidar do seu cão no verão'
  })
  titulo: string;

  @ApiProperty({
    description: 'Conteúdo do artigo em formato JSON (TipTap)',
    example: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Este é o conteúdo do artigo...'
            }
          ]
        }
      ]
    }
  })
  conteudo: any;

  @ApiPropertyOptional({
    description: 'Resumo do artigo',
    example: 'Dicas importantes para manter seu cão saudável durante o verão'
  })
  resumo?: string;

  @ApiProperty({
    description: 'Autor do artigo',
    example: 'Dr. João Silva'
  })
  autor: string;

  @ApiProperty({
    description: 'Categoria do artigo',
    example: 'Saúde'
  })
  categoria: string;

  @ApiProperty({
    description: 'Status do artigo',
    enum: StatusArtigo
  })
  status: StatusArtigo;

  @ApiProperty({
    description: 'Data de publicação do artigo',
    example: '2024-01-15T10:00:00Z'
  })
  dataPublicacao: Date;

  @ApiProperty({
    description: 'URL da imagem de capa',
    example: 'https://example.com/images/capa-artigo.jpg'
  })
  imagemCapa: string;

  @ApiProperty({
    description: 'Número de visualizações',
    example: 150
  })
  visualizacoes: number;

  @ApiProperty({
    description: 'Número de curtidas',
    example: 25
  })
  curtidas: number;

  @ApiProperty({
    description: 'Número de comentários',
    example: 8
  })
  comentarios: number;

  @ApiProperty({
    description: 'Se o artigo é destaque',
    example: false
  })
  destaque: boolean;

  @ApiProperty({
    description: 'Tags do artigo',
    example: ['saúde', 'verão', 'cuidados']
  })
  tags: string[];

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