import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class CreatePagamentoDto {
  @IsString()
  @IsNotEmpty()
  cadastroId: string;

  @IsNumber()
  @IsPositive()
  valor: number;
}
