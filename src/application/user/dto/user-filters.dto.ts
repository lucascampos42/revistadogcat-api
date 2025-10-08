import { IsOptional, IsEnum, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { Role } from '@prisma/client';
import { PaginationDto } from '../../../core/dto';

export class UserFiltersDto extends PaginationDto {
  @IsOptional()
  @IsEnum(Role, {
    message:
      'Role deve ser um valor válido (USUARIO, DONO_PET_APROVADO, ASSINANTE, DONO_PET_APROVADO_ASSINANTE, ADMIN, EDITOR, FUNCIONARIO)',
  })
  role?: Role;

  @IsOptional()
  @IsString({ message: 'Nome de usuário deve ser uma string' })
  @Transform(({ value }: { value: string }) => value?.trim())
  userName?: string;

  @IsOptional()
  @IsString({ message: 'Email deve ser uma string' })
  @Transform(({ value }: { value: string }) => value?.trim())
  email?: string;
}
