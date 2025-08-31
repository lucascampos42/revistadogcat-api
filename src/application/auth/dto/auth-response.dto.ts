import { ApiProperty } from '@nestjs/swagger';

// Adicionando um DTO para o endereço para melhor documentação
export class EnderecoDto {
  @ApiProperty()
  logradouro: string;

  @ApiProperty()
  numero: string;

  @ApiProperty({ nullable: true })
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

export class AuthUserDto {
  @ApiProperty({ description: 'ID único do usuário' })
  userId: string;

  @ApiProperty({ description: 'Nome de usuário', nullable: true })
  userName: string | null;

  @ApiProperty({ description: 'Nome completo do usuário' })
  name: string;

  @ApiProperty({ description: 'Email do usuário' })
  email: string;

  @ApiProperty({ description: 'Role/função do usuário no sistema' })
  role: string;

  @ApiProperty({ description: 'URL do avatar do usuário', nullable: true })
  avatarUrl: string | null;

  @ApiProperty({ 
    description: 'Endereço do usuário', 
    type: EnderecoDto, 
    nullable: true 
  })
  endereco?: EnderecoDto | null;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'Token de acesso JWT' })
  access_token: string;

  @ApiProperty({ description: 'Token de renovação JWT' })
  refresh_token: string;

  @ApiProperty({ description: 'Dados do usuário autenticado', type: AuthUserDto })
  user: AuthUserDto;
}
