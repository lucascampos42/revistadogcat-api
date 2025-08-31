import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateComentarioDto {
  @ApiProperty({
    description: 'Conteúdo do comentário',
    example: 'Ótimo artigo! Muito informativo.',
  })
  @IsString()
  @IsNotEmpty()
  conteudo: string;

  @ApiProperty({
    description: 'ID do usuário que está comentando',
    example: 'user-uuid-1234',
  })
  @IsUUID()
  @IsNotEmpty()
  autorId: string;
}
