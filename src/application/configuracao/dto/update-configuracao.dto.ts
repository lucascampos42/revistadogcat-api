import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class UpdateConfiguracaoDto {
  @IsString()
  @IsNotEmpty()
  chave: string;

  @IsString()
  @IsNotEmpty()
  valor: string;

  @IsString()
  @IsOptional()
  descricao?: string;
}
