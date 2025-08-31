import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../../application/user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // Deixa o GlobalAuthGuard tratar a expiração
      secretOrKey: process.env.JWT_SECRET || 'default-secret',
    });
  }

  async validate(payload: any) {
    // Correção: Usar o método interno que não requer verificação de permissão.
    const user = await this.userService.findUserEntityById(payload.sub);
    // A estratégia apenas anexa o usuário encontrado ao request.
    // O GlobalAuthGuard fará as validações de segurança completas.
    return user;
  }
}
