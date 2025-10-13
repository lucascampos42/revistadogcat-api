import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatusArtigo, CategoriaArtigo } from '@prisma/client';
import { ComentarioResponseDto } from './comentario-response.dto';

class ArtigoAutorResponseDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  avatarUrl?: string;
}

export class ArtigoResponseDto {
  @ApiProperty({ description: 'ID único do artigo' })
  artigoId: string;

  @ApiProperty({ description: 'Título do artigo' })
  titulo: string;

  @ApiProperty({ description: 'Conteúdo do artigo em formato JSON (TipTap)' })
  conteudo: any;

  @ApiPropertyOptional({ description: 'Resumo do artigo' })
  resumo?: string;

  @ApiProperty({ description: 'Autor do artigo', type: ArtigoAutorResponseDto })
  autor: ArtigoAutorResponseDto;

  @ApiProperty({ description: 'Categoria do artigo', enum: CategoriaArtigo })
  categoria: CategoriaArtigo;

  @ApiProperty({ description: 'Status do artigo', enum: StatusArtigo })
  status: StatusArtigo;

  @ApiProperty({ description: 'Data de publicação do artigo' })
  dataPublicacao: Date;

  @ApiPropertyOptional({
    description: 'URL da imagem de capa (quando disponível)',
  })
  imagemCapa?: string;

  @ApiProperty({ description: 'Número de visualizações' })
  visualizacoes: number;

  @ApiProperty({ description: 'Número de curtidas' })
  curtidas: number;

  @ApiProperty({
    description: 'Comentários do artigo',
    type: [ComentarioResponseDto],
  })
  comentarios: ComentarioResponseDto[];

  @ApiProperty({ description: 'Se o artigo é destaque' })
  destaque: boolean;

  @ApiProperty({ description: 'Tags do artigo' })
  tags: string[];

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de última atualização' })
  updatedAt: Date;
}
