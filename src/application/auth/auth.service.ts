import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-auth.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ActivateAccountDto } from './dto/activate-account.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import * as crypto from 'crypto';
import { User } from '@prisma/client';
import { MailService } from '../../core/mail/mail.service';
import { ValidationUtils } from '../../core/utils/validation.utils';
import {
  IAuthRepository,
  AUTH_REPOSITORY_TOKEN,
} from './repositories/auth.repository.interface';
import {
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '../../core/exceptions/custom-exceptions';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private mailService: MailService,
    @Inject(AUTH_REPOSITORY_TOKEN)
    private readonly authRepository: IAuthRepository,
    private readonly configService: ConfigService,
  ) {}

  private getActivationTokenExpiration(): Date {
    const hoursToExpire = Number(
      this.configService.get('ACTIVATION_TOKEN_EXPIRY_HOURS', '24'),
    );
    return new Date(Date.now() + hoursToExpire * 60 * 60 * 1000);
  }

  private getRefreshTokenExpiry(): string {
    return (
      this.configService.get<string>('JWT_REFRESH_TTL') ||
      this.configService.get<string>('REFRESH_TOKEN_TTL') ||
      '7d'
    );
  }

  private async signAccessToken(user: User): Promise<string> {
    const payload = {
      sub: user.userId,
      username: user.userName,
      tokenVersion: user.tokenVersion,
    };
    return this.jwtService.signAsync(payload);
  }

  private async signRefreshToken(user: User): Promise<string> {
    const payload = {
      sub: user.userId,
      tv: user.tokenVersion,
      type: 'refresh',
    };
    return this.jwtService.signAsync(payload, {
      expiresIn: this.getRefreshTokenExpiry(),
      secret:
        this.configService.get<string>('JWT_REFRESH_SECRET') ||
        process.env.JWT_SECRET ||
        'default-secret',
    });
  }

  async issueTokens(user: User): Promise<AuthResponseDto> {
    const access_token = await this.signAccessToken(user);
    const refresh_token = await this.signRefreshToken(user);

    await this.authRepository.updateUserTokens(user.userId, {
      refreshToken: refresh_token,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, cpf, ...publicUser } = user;

    return { 
      access_token, 
      refresh_token,
      user: {
        userId: publicUser.userId,
        userName: publicUser.userName,
        name: publicUser.name,
        email: publicUser.email,
        role: publicUser.role,
        avatarUrl: publicUser.avatarUrl
      }
    };
  }

  async register(
    createUserDto: CreateUserDto,
  ): Promise<Omit<User, 'password' | 'activationToken'> & { message: string }> {
    if (createUserDto.cpf) {
      const normalizedCpf = ValidationUtils.normalizeCpf(createUserDto.cpf);
      if (!ValidationUtils.isValidCpf(normalizedCpf)) {
        throw new BadRequestException('CPF inválido');
      }
      createUserDto.cpf = normalizedCpf;
    }

    const existingUser = await this.userService.checkUserExists({
      userName: createUserDto.userName,
      email: createUserDto.email,
      cpf: createUserDto.cpf,
    });

    const errors: string[] = [];
    if (existingUser.userNameExists) errors.push('Username já está em uso');
    if (existingUser.emailExists) errors.push('Email já está cadastrado');
    if (existingUser.cpfExists) errors.push('CPF já está cadastrado');

    if (errors.length > 0) {
      throw new ConflictException(`Dados já existem: ${errors.join(', ')}`);
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const activationToken = crypto.randomBytes(32).toString('hex');
    const activationTokenExpires = this.getActivationTokenExpiration();

    const result = await this.authRepository.createUser({
      ...createUserDto,
      password: hashedPassword,
      activationToken,
      activationTokenExpires,
    });

    await this.mailService.sendActivationEmail(result, activationToken);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, activationToken: token, ...user } = result;
    return {
      ...user,
      message: 'Usuário registrado. Verifique seu email para ativar a conta.',
    };
  }

  private async handleFailedLogin(user: User): Promise<void> {
    const maxAttempts = 5;
    const lockoutDuration = 15 * 60 * 1000;
    const newAttempts = user.loginAttempts + 1;

    const updateData: Partial<User> = {
      loginAttempts: newAttempts,
      lastFailedLogin: new Date(),
    };

    if (newAttempts >= 3) {
      await this.mailService.sendMultipleLoginAttemptsAlert(user, newAttempts);
    }

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
    };

    if (user.blocked && user.blockedUntil && user.blockedUntil <= new Date()) {
      updateData.blocked = false;
      updateData.blockedUntil = null;
    }

    await this.userService.systemUpdate(user.userId, updateData);
  }

  async signIn(
    identification: string,
    pass: string,
    loginDetails?: { ip: string; userAgent: string },
  ): Promise<AuthResponseDto> {
    const user = await this.userService.findUserEntityByIdentification(identification);
    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    if (!user.active) {
      throw new UnauthorizedException('Conta inativa.');
    }

    if (user.blocked) {
      if (user.blockedUntil && user.blockedUntil <= new Date()) {
        await this.userService.systemUpdate(user.userId, {
          blocked: false,
          blockedUntil: null,
          loginAttempts: 0,
        });
      } else {
        throw new UnauthorizedException('Conta temporariamente bloqueada.');
      }
    }

    if (!user.password) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      await this.handleFailedLogin(user);
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    if (loginDetails && this.isSuspiciousLogin(user)) {
      await this.mailService.sendSuspiciousLoginAlert(user, { ...loginDetails, timestamp: new Date() });
    }

    await this.handleSuccessfulLogin(user);
    return this.issueTokens(user);
  }

  private isSuspiciousLogin(user: User): boolean {
    if (!user.lastLogin) return false;
    const daysSinceLastLogin = Math.floor((Date.now() - user.lastLogin.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceLastLogin > 30;
  }

  async refreshToken(token: string): Promise<AuthResponseDto> {
    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string; tv: number; type: string; }>(token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'default-secret',
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Token inválido');
      }

      const user = await this.userService.findUserEntityById(payload.sub);
      if (!user) throw new UnauthorizedException('Usuário não encontrado');
      if (user.tokenVersion !== payload.tv) {
        throw new UnauthorizedException('Refresh token expirado/invalidado');
      }
      return this.issueTokens(user);
    } catch {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string; token: string }> {
    const user = await this.userService.findUserEntityByIdentification(forgotPasswordDto.email);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const passwordResetExpires = new Date(Date.now() + 3600000);

    await this.userService.systemUpdate(user.userId, {
      passwordResetToken,
      passwordResetExpires,
    });

    return {
      message: 'Token de redefinição de senha gerado. Verifique seu e-mail.',
      token: resetToken,
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, password, passwordConfirmation } = resetPasswordDto;
    if (password !== passwordConfirmation) {
      throw new BadRequestException('As senhas não conferem.');
    }

    const passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await this.authRepository.findUserByPasswordResetToken(passwordResetToken);
    if (!user) {
      throw new UnauthorizedException('Token inválido ou expirado.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await this.authRepository.updateUserPassword(user.userId, hashedPassword);
    return { message: 'Senha redefinida com sucesso' };
  }

  async activateAccount(activateDto: ActivateAccountDto): Promise<{ message: string }> {
    const { token } = activateDto;
    const user = await this.authRepository.findUserByActivationToken(token);
    if (!user) {
      throw new BadRequestException('Token de ativação inválido ou expirado');
    }
    await this.authRepository.activateUser(user.userId);
    return { message: 'Conta ativada com sucesso!' };
  }

  async resendActivationEmail(email: string): Promise<{ message: string }> {
    const user = await this.authRepository.findUserByEmail(email);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    if (user.active) {
      throw new BadRequestException('Esta conta já está ativada');
    }

    const activationToken = crypto.randomBytes(32).toString('hex');
    const activationTokenExpires = this.getActivationTokenExpiration();

    await this.authRepository.updateUserTokens(user.userId, {
      activationToken,
      activationTokenExpires,
    });

    await this.mailService.sendActivationEmail({ ...user, activationToken, activationTokenExpires }, activationToken);
    return { message: 'Email de ativação reenviado com sucesso' };
  }

  async logout(userId: string): Promise<void> {
    await this.authRepository.incrementTokenVersion(userId);
  }

  async validateUser(identifier: string, password: string) {
    const user = await this.userService.findUserEntityByIdentification(identifier);
    if (user && user.deletedAt === null) {
      if (!user.active) {
        await this.mailService.sendUserConfirmation(user);
        throw new UnauthorizedException('A conta do usuário não está ativada.');
      }
      if (!user.password) {
        throw new UnauthorizedException('Senha não definida.');
      }
      const isValid = await bcrypt.compare(password, user.password);
      if (isValid) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...result } = user;
        return result;
      }
    }
    throw new UnauthorizedException('Identificação ou senha incorretos.');
  }
}
