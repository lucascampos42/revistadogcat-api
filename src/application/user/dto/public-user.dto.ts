import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AddressDto } from './address.dto';

export class PublicUserDto {
  @ApiProperty({ description: 'ID único do usuário' })
  userId: string;

  @ApiProperty({
    description: 'Nome de usuário',
    required: false,
    nullable: true,
  })
  userName?: string | null;

  @ApiProperty({ description: 'Nome completo do usuário' })
  name: string;

  @ApiProperty({ description: 'Endereço de e-mail do usuário' })
  email: string;

  @ApiProperty({
    description: 'CPF do usuário',
    required: false,
    nullable: true,
  })
  cpf?: string | null;

  @ApiProperty({
    description: 'URL do avatar do usuário',
    required: false,
    nullable: true,
  })
  avatarUrl?: string | null;

  @ApiProperty({ description: 'Nível de acesso do usuário', enum: Role })
  role: Role;

  @ApiProperty({ description: 'Indica se a conta está ativa' })
  active: boolean;

  @ApiProperty({ description: 'Indica se a conta está bloqueada' })
  blocked: boolean;

  @ApiProperty({ description: 'Data de criação da conta' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização' })
  updatedAt: Date;

  @ApiProperty({
    description: 'Data do último login',
    required: false,
    nullable: true,
  })
  lastLogin?: Date | null;

  @ApiProperty({
    description: 'Endereço principal do usuário',
    required: false,
    type: AddressDto,
  })
  endereco?: AddressDto;
}
