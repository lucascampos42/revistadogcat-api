import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Nova senha do usuário',
    example: 'NovaSenha@123',
  })
  @IsString({ message: 'Senha deve ser uma string' })
  @MinLength(8, { message: 'Senha deve ter pelo menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&+\-._#]/, {
    message:
      'A senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula e 1 número',
  })
  password: string;
}
