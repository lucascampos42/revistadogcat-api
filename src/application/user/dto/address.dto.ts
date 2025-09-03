import { ApiProperty } from '@nestjs/swagger';

export class AddressDto {
  @ApiProperty()
  logradouro: string;

  @ApiProperty()
  numero: string;

  @ApiProperty({ required: false, nullable: true })
  complemento?: string | null;

  @ApiProperty()
  bairro: string;

  @ApiProperty()
  cidade: string;

  @ApiProperty()
  estado: string;

  @ApiProperty()
  cep: string;
}
