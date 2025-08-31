import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class CreateRacaDto {
  @ApiProperty({
    description: 'Nome da raça',
    example: 'Golden Retriever',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  nome: string;
}
