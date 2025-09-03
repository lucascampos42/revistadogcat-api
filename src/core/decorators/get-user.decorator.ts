import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthRequest } from '../../application/auth/models/AuthRequest';

/**
 * Decorador de parâmetro de rota que extrai o objeto `user` da requisição.
 * O objeto `user` é adicionado à requisição pelo `JwtAuthGuard`.
 *
 * @example
 * // Injeta o objeto de usuário completo:
 * getProfile(@User() user: UserPayload) { ... }
 *
 * // Injeta uma propriedade específica do usuário (ex: o ID):
 * deleteAccount(@User('userId') userId: string) { ... }
 */
export const User = createParamDecorator(
  (data: keyof AuthRequest['user'] | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthRequest>();
    const user = request.user;

    // Se um campo específico (como 'userId') for solicitado, retorne-o.
    // Caso contrário, retorne o objeto de usuário completo.
    return data ? user?.[data] : user;
  },
);
