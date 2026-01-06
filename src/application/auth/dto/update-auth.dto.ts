import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-auth.dto';
import {
  IsOptional,
  IsString,
  MinLength,
  Matches,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const),
) {
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string' && value.trim() === '') return undefined;
    if (value === null) return undefined;
    return value;
  })
  @ValidateIf((o) => o.password !== undefined && o.password !== null)
  @IsString({ message: 'Senha deve ser uma string' })
  @MinLength(8, { message: 'Senha deve ter pelo menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'A senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial',
  })
  password?: string;
}
