import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

/**
 * DTO para atualização do role de um usuário
 * Utilizado no endpoint PATCH /users/:id/role (apenas ADMIN)
 */
export class UpdateUserRoleDto {
  @ApiProperty({
    description: 'Novo role do usuário',
    enum: Role,
    example: 'DONO_PET_APROVADO',
  })
  @IsNotEmpty({ message: 'Role é obrigatório' })
  @IsEnum(Role, {
    message:
      'Role deve ser um valor válido (USUARIO, DONO_PET_APROVADO, ASSINANTE, DONO_PET_APROVADO_ASSINANTE, ADMIN, EDITOR, FUNCIONARIO)',
  })
  role: Role;
}
