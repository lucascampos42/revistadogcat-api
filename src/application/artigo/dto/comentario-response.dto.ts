import { ApiProperty } from '@nestjs/swagger';

class ComentarioAutorResponseDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  avatarUrl?: string;
}

export class ComentarioResponseDto {
  @ApiProperty()
  comentarioId: string;

  @ApiProperty()
  conteudo: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  artigoId: string;

  @ApiProperty({ type: () => ComentarioAutorResponseDto })
  autor: ComentarioAutorResponseDto;
}
