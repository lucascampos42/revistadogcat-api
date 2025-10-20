import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EdicaoResponseDto {
  @ApiProperty({ description: 'ID da edição' })
  id: string;

  @ApiProperty({ description: 'Título da edição' })
  titulo: string;

  @ApiProperty({ description: 'Descrição da edição' })
  descricao: string;

  @ApiProperty({ description: 'Data da edição' })
  data: Date;

  @ApiProperty({ description: 'URL pública do PDF' })
  pdfUrl: string;

  @ApiPropertyOptional({ description: 'URL da imagem de capa (opcional)' })
  capaUrl?: string;
}
