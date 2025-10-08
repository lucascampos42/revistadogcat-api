import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../decorators/is-public.decorator';
import { PrismaService } from '../config/prisma.service';

@Injectable()
export class GlobalAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token de acesso é obrigatório');
    }

    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        username: string;
        tokenVersion?: number;
      }>(token);

      const user = await this.prisma.user.findUnique({
        where: { userId: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException(
          'Usuário associado ao token não foi encontrado',
        );
      }

      if (
        typeof payload.tokenVersion === 'number' &&
        payload.tokenVersion !== user.tokenVersion
      ) {
        throw new UnauthorizedException(
          'Token de acesso revogado. Por favor, faça login novamente.',
        );
      }

      request.user = {
        userId: payload.sub,
        userName: payload.username,
        tokenVersion: user.tokenVersion,
        role: user.role,
      };
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException('Token de acesso expirado');
      }
      // Para outros erros de JWT (malformado, assinatura inválida, etc.)
      throw new UnauthorizedException('Token de acesso inválido');
    }

    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
