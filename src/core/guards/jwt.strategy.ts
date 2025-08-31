import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../application/user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'default-secret',
    });
  }

  async validate(payload: { sub: string; username: string; tokenVersion: number }) {
    // Usar o método interno que não requer verificação de permissão
    const user = await this.userService.findUserEntityById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    // Verificar se o token foi invalidado (ex: após logout ou troca de senha)
    if (user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException('Token de acesso revogado');
    }

    return {
      userId: user.userId,
      userName: user.userName,
      role: user.role,
      tokenVersion: user.tokenVersion,
    };
  }
}
