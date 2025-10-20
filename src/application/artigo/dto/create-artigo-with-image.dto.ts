import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatusArtigo, CategoriaArtigo } from '@prisma/client';

export class CreateArtigoWithImageDto {
  @ApiProperty({
    description: 'Título do artigo',
    example: 'Como cuidar do seu cão no verão',
  })
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @ApiProperty({
    description: 'Conteúdo do artigo em formato JSON (TipTap)',
    example: JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Este é o conteúdo do artigo...',
            },
          ],
        },
      ],
    }),
  })
  @IsString()
  @IsNotEmpty()
  conteudo: string;

  @ApiPropertyOptional({
    description: 'Resumo do artigo',
    example: 'Dicas importantes para manter seu cão saudável durante o verão',
  })
  @IsOptional()
  @IsString()
  resumo?: string;

  @ApiProperty({
    description: 'ID do autor do artigo',
    example: 'user-uuid-goes-here',
  })
  @IsUUID()
  @IsNotEmpty()
  autorId: string;

  @ApiProperty({
    description: 'Categoria do artigo',
    enum: CategoriaArtigo,
    example: CategoriaArtigo.SAUDE,
  })
  @IsEnum(CategoriaArtigo)
  @IsNotEmpty()
  categoria: CategoriaArtigo;

  @ApiPropertyOptional({
    description: 'Status do artigo',
    enum: StatusArtigo,
    default: StatusArtigo.RASCUNHO,
  })
  @IsOptional()
  @IsEnum(StatusArtigo)
  status?: StatusArtigo;

  @ApiProperty({
    description: 'Data de publicação do artigo',
    example: '2024-01-15T10:00:00Z',
  })
  @IsDateString()
  dataPublicacao: string;

  @ApiPropertyOptional({
    description: 'Se o artigo é destaque',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  destaque?: boolean;

  @ApiPropertyOptional({
    description: 'Tags do artigo',
    example: ['saúde', 'verão', 'cuidados'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
