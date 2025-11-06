import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-auth.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthResponseDto, AuthUserDto } from './dto/auth-response.dto';
import * as crypto from 'crypto';
import { User, Role } from '@prisma/client';
import { MailService } from '../../core/mail/mail.service';
import { ValidationUtils } from '../../core/utils/validation.utils';
import {
  IAuthRepository,
  AUTH_REPOSITORY_TOKEN,
} from './repositories/auth.repository.interface';
import {
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '../../core/exceptions/custom-exceptions';

// --- Interface de Payload para o Token ---
interface AccessTokenPayload {
  sub: string;
  email: string;
  role: Role;
  tokenVersion: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private mailService: MailService,
    @Inject(AUTH_REPOSITORY_TOKEN)
    private readonly authRepository: IAuthRepository,
    private readonly configService: ConfigService,
  ) {}

  // Helper para parsear o TTL (Time To Live) de strings como '7d', '24h'
  private parseTTL(ttl: string): number {
    const value = parseInt(ttl.slice(0, -1));
    const unit = ttl.slice(-1);

    switch (unit) {
      case 's':
        return value * 1000; // segundos
      case 'm':
        return value * 60 * 1000; // minutos
      case 'h':
        return value * 60 * 60 * 1000; // horas
      case 'd':
        return value * 24 * 60 * 60 * 1000; // dias
      default:
        this.logger.warn(
          `Unidade de tempo desconhecida para TTL: ${ttl}. Usando 7 dias como padrão.`,
        );
        return 7 * 24 * 60 * 60 * 1000; // Padrão de 7 dias
    }
  }

  // --- Geração de Token ---

  private async signAccessToken(user: User): Promise<string> {
    const payload: AccessTokenPayload = {
      sub: user.userId,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    };
    return this.jwtService.signAsync(payload);
  }

  async issueTokens(user: User): Promise<AuthResponseDto> {
    const access_token = await this.signAccessToken(user);
    const refresh_token = crypto.randomBytes(32).toString('hex');

    const refreshTokenTTL = this.configService.get<string>(
      'JWT_REFRESH_TTL',
      '7d',
    );
    const refreshTokenExpiresAt = new Date(
      Date.now() + this.parseTTL(refreshTokenTTL),
    );

    await this.authRepository.updateUserTokens(user.userId, {
      refreshToken: refresh_token,
      refreshTokenExpiresAt: refreshTokenExpiresAt,
    });

    const responseUser: AuthUserDto = {
      userId: user.userId,
      userName: user.userName,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
    };

    return { access_token, refresh_token, user: responseUser };
  }

  async refreshToken(
    userId: string,
    providedRefreshToken: string,
  ): Promise<AuthResponseDto> {
    const user = await this.userService.findUserEntityById(userId);
    if (!user || !user.refreshToken || !user.refreshTokenExpiresAt) {
      throw new UnauthorizedException('Acesso negado.');
    }

    // Verifica se o refresh token expirou por tempo
    if (user.refreshTokenExpiresAt < new Date()) {
      // Opcional: Limpar o refresh token expirado do banco de dados aqui
      await this.authRepository.updateUserTokens(userId, {
        refreshToken: null,
        refreshTokenExpiresAt: null,
      });
      throw new UnauthorizedException(
        'Refresh token expirado. Faça login novamente.',
      );
    }

    const isRefreshTokenMatching = providedRefreshToken === user.refreshToken;

    if (!isRefreshTokenMatching) {
      // Se o token não corresponder, pode ser uma tentativa de uso indevido
      // Invalida a sessão atual para forçar novo login
      await this.authRepository.incrementTokenVersion(userId);
      throw new UnauthorizedException(
        'Refresh token inválido. Faça login novamente.',
      );
    }

    return this.issueTokens(user);
  }

  // --- Lógica de Autenticação ---

  async signIn(
    identification: string,
    pass: string,
    loginDetails?: { ip: string; userAgent: string },
  ): Promise<AuthResponseDto> {
    const user = await this.userService.findUserForAuth(identification);
    if (!user || !user.password || user.deletedAt) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      await this.handleFailedLogin(user);
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    if (user.blocked) {
      if (user.blockedUntil && user.blockedUntil > new Date()) {
        throw new UnauthorizedException('Conta temporariamente bloqueada.');
      }
    }

    if (loginDetails && this.isSuspiciousLogin(user)) {
      await this.mailService.sendSuspiciousLoginAlert(user, {
        ...loginDetails,
        timestamp: new Date(),
      });
    }

    await this.handleSuccessfulLogin(user);
    return this.issueTokens(user);
  }

  async register(
    createUserDto: CreateUserDto,
  ): Promise<Omit<User, 'password'> & { message: string }> {
    if (createUserDto.cpf) {
      const normalizedCpf = ValidationUtils.normalizeCpf(createUserDto.cpf);
      if (!ValidationUtils.isValidCpf(normalizedCpf)) {
        throw new BadRequestException('CPF inválido');
      }
      createUserDto.cpf = normalizedCpf;
    }

    const { userNameExists, emailExists, cpfExists } =
      await this.userService.checkUserExists({
        userName: createUserDto.userName,
        email: createUserDto.email,
        cpf: createUserDto.cpf,
      });

    if (userNameExists || emailExists || cpfExists) {
      const errors: string[] = [];
      if (userNameExists) errors.push('Username');
      if (emailExists) errors.push('Email');
      if (cpfExists) errors.push('CPF');
      throw new ConflictException(`Dados já existem: ${errors.join(', ')}`);
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const userToCreate = {
      name: createUserDto.name,
      userName: createUserDto.userName,
      email: createUserDto.email,
      cpf: createUserDto.cpf || null,
      telefone: createUserDto.telefone || null,
      avatarUrl: createUserDto.avatarUrl || null,
      role: createUserDto.role || Role.USUARIO,
      password: hashedPassword,
      active: true,
      blocked: false,
      loginAttempts: 0,
      tokenVersion: 1,
      lastLogin: null,
      blockedUntil: null,
      lastFailedLogin: null,
      refreshToken: null,
      refreshTokenExpiresAt: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      deletedAt: null,
      votosDisponiveis: 0,
      votosUtilizados: 0,
    };

    const newUser = await this.authRepository.createUser(userToCreate);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...user } = newUser;
    return {
      ...user,
      message: 'Usuário registrado com sucesso.',
    };
  }

  // --- Tratamento de Falhas e Sucesso de Login ---

  private async handleFailedLogin(user: User): Promise<void> {
    const maxAttempts = 20;
    const lockoutDuration = 15 * 60 * 1000;
    const newAttempts = (user.loginAttempts || 0) + 1;

    const updateData: Partial<User> = {
      loginAttempts: newAttempts,
      lastFailedLogin: new Date(),
    };

    if (newAttempts >= maxAttempts) {
      updateData.blocked = true;
      updateData.blockedUntil = new Date(Date.now() + lockoutDuration);
      updateData.loginAttempts = 0;
      await this.mailService.sendAccountBlockedAlert(user, '15 minutos');
    }

    await this.userService.systemUpdate(user.userId, updateData);
  }

  private async handleSuccessfulLogin(user: User): Promise<void> {
    const updateData: Partial<User> = {
      lastLogin: new Date(),
      loginAttempts: 0,
      blocked: false,
      blockedUntil: null,
    };

    await this.userService.systemUpdate(user.userId, updateData);
  }

  private isSuspiciousLogin(user: User): boolean {
    if (!user.lastLogin) return false;
    const daysSinceLastLogin =
      (Date.now() - user.lastLogin.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceLastLogin > 30;
  }

  // --- Outros Métodos de Autenticação ---

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.userService.findUserForAuth(
      forgotPasswordDto.email,
    );
    if (!user) {
      return {
        message:
          'Se um usuário com este e-mail existir, um link de redefinição de senha será enviado.',
      };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    await this.userService.systemUpdate(user.userId, {
      passwordResetToken,
      passwordResetExpires: new Date(Date.now() + 3600000),
    });

    await this.mailService.sendPasswordResetEmail(
      user.email,
      user.name,
      resetToken,
    );

    return {
      message:
        'Se um usuário com este e-mail existir, um link de redefinição de senha será enviado.',
    };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const { token, password } = resetPasswordDto;
    const passwordResetToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user =
      await this.authRepository.findUserByPasswordResetToken(
        passwordResetToken,
      );
    if (!user) {
      throw new UnauthorizedException('Token inválido ou expirado.');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await this.authRepository.updateUserPassword(user.userId, hashedPassword);
    return { message: 'Senha redefinida com sucesso' };
  }

  async logout(userId: string): Promise<void> {
    // Ao fazer logout, também invalidamos o refresh token e sua expiração
    await this.authRepository.updateUserTokens(userId, {
      refreshToken: null,
      refreshTokenExpiresAt: null,
    });
    await this.authRepository.incrementTokenVersion(userId);
  }

  async validateUser(
    identifier: string,
    pass: string,
  ): Promise<Omit<User, 'password'> | null> {
    const user = await this.userService.findUserForAuth(identifier);
    if (user && user.password && (await bcrypt.compare(pass, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }
    return null;
  }
}
