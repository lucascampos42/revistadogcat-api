import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean, IsArray, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatusArtigo } from '@prisma/client';

export class CreateArtigoDto {
  @ApiProperty({
    description: 'Título do artigo',
    example: 'Como cuidar do seu cão no verão'
  })
  @IsString()
  @IsNotEmpty()
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
  @IsNotEmpty()
  conteudo: any;

  @ApiPropertyOptional({
    description: 'Resumo do artigo',
    example: 'Dicas importantes para manter seu cão saudável durante o verão'
  })
  @IsOptional()
  @IsString()
  resumo?: string;

  @ApiProperty({
    description: 'Autor do artigo',
    example: 'Dr. João Silva'
  })
  @IsString()
  @IsNotEmpty()
  autor: string;

  @ApiProperty({
    description: 'Categoria do artigo',
    example: 'Saúde'
  })
  @IsString()
  @IsNotEmpty()
  categoria: string;

  @ApiPropertyOptional({
    description: 'Status do artigo',
    enum: StatusArtigo,
    default: StatusArtigo.RASCUNHO
  })
  @IsOptional()
  @IsEnum(StatusArtigo)
  status?: StatusArtigo;

  @ApiProperty({
    description: 'Data de publicação do artigo',
    example: '2024-01-15T10:00:00Z'
  })
  @IsDateString()
  dataPublicacao: string;

  @ApiProperty({
    description: 'URL da imagem de capa',
    example: 'https://example.com/images/capa-artigo.jpg'
  })
  @IsString()
  @IsNotEmpty()
  imagemCapa: string;

  @ApiPropertyOptional({
    description: 'Se o artigo é destaque',
    default: false
  })
  @IsOptional()
  @IsBoolean()
  destaque?: boolean;

  @ApiPropertyOptional({
    description: 'Tags do artigo',
    example: ['saúde', 'verão', 'cuidados']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}