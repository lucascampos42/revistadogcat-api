import { ApiProperty } from '@nestjs/swagger';
import { PublicUserDto } from './public-user.dto';
import { AddressDto } from './address.dto';

export class FullUserDto extends PublicUserDto {
  @ApiProperty({
    description: 'Telefone do usuário',
    required: false,
    nullable: true,
  })
  telefone?: string | null;

  @ApiProperty({
    description: 'Lista de endereços do usuário',
    isArray: true,
    type: AddressDto,
  })
  enderecos: AddressDto[];
}
