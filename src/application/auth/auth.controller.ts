import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  UnauthorizedException,
  Get,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import {
  CreateUserDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ActivateAccountDto,
  ResendActivationDto,
  RefreshTokenDto,
} from './dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { IsPublic } from '../../core/decorators/is-public.decorator';
import { AuthRequest } from './models/AuthRequest';
import { AuthThrottle } from '../../core/decorators/auth-throttle.decorator';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @IsPublic()
  @AuthThrottle()
  @ApiOperation({ summary: 'Fazer login no sistema' })
  @ApiResponse({
    status: 200,
    description:
      'Login realizado com sucesso - retorna tokens de acesso e dados do usuário',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados de login inválidos' })
  @ApiResponse({ status: 401, description: 'Credenciais incorretas' })
  @ApiResponse({
    status: 429,
    description: 'Muitas tentativas de login - rate limit atingido',
  })
  signIn(@Body() loginDto: LoginDto, @Req() req: Request) {
    const loginDetails = this.getLoginDetails(req);
    return this.authService.signIn(
      loginDto.identification,
      loginDto.password,
      loginDetails,
    );
  }

  @Post('register')
  @IsPublic()
  @AuthThrottle()
  @ApiOperation({ summary: 'Registrar novo usuário' })
  @ApiResponse({
    status: 201,
    description: 'Usuário registrado com sucesso - email de ativação enviado',
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos fornecidos' })
  @ApiResponse({
    status: 409,
    description: 'Usuário já existe (email, username ou CPF duplicado)',
  })
  @ApiResponse({
    status: 429,
    description: 'Muitas tentativas de registro - rate limit atingido',
  })
  async signUp(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @IsPublic()
  @AuthThrottle()
  @ApiOperation({ summary: 'Solicitar redefinição de senha' })
  @ApiResponse({
    status: 200,
    description: 'Token de redefinição gerado e enviado por email',
  })
  @ApiResponse({ status: 400, description: 'Email inválido' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({
    status: 429,
    description: 'Muitas tentativas - rate limit atingido',
  })
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @IsPublic()
  @ApiOperation({ summary: 'Redefinir senha com token' })
  @ApiResponse({ status: 200, description: 'Senha redefinida com sucesso' })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou senhas não conferem',
  })
  @ApiResponse({ status: 401, description: 'Token inválido ou expirado' })
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('activate')
  @HttpCode(HttpStatus.OK)
  @IsPublic()
  @ApiOperation({ summary: 'Ativar conta de usuário' })
  @ApiResponse({ status: 200, description: 'Conta ativada com sucesso' })
  @ApiResponse({
    status: 400,
    description: 'Token de ativação inválido ou expirado',
  })
  activateAccount(@Body() activateDto: ActivateAccountDto) {
    return this.authService.activateAccount(activateDto);
  }

  @Post('resend-activation')
  @HttpCode(HttpStatus.OK)
  @IsPublic()
  @ApiOperation({ summary: 'Reenviar email de ativação' })
  @ApiResponse({
    status: 200,
    description: 'Email de ativação reenviado com sucesso',
  })
  @ApiResponse({ status: 400, description: 'Conta já está ativada' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  resendActivationEmail(@Body() resendDto: ResendActivationDto) {
    return this.authService.resendActivationEmail(resendDto.email);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @IsPublic()
  @ApiOperation({ summary: 'Renovar token de acesso' })
  @ApiResponse({
    status: 200,
    description:
      'Tokens renovados com sucesso - retorna tokens e dados do usuário',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token inválido ou expirado',
  })
  async refresh(@Body() body: RefreshTokenDto) {
    return this.authService.refreshToken(body.refreshToken);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter perfil do usuário autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Perfil do usuário retornado com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de acesso inválido ou expirado',
  })
  getProfile(@Req() req: AuthRequest) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }
    return req.user;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fazer logout e invalidar tokens' })
  @ApiResponse({ status: 200, description: 'Logout realizado com sucesso' })
  @ApiResponse({
    status: 401,
    description: 'Token de acesso inválido ou expirado',
  })
  async logout(@Req() req: AuthRequest): Promise<{ message: string }> {
    if (!req.user?.userId) {
      throw new UnauthorizedException('User not found in request');
    }
    await this.authService.logout(req.user.userId);
    return { message: 'Logout realizado com sucesso.' };
  }

  /**
   * Extrai os detalhes relevantes da requisição para fins de log e segurança.
   * Prioriza o cabeçalho 'x-forwarded-for' para obter o IP real do cliente
   * em ambientes com proxy.
   * @param req O objeto de requisição do Express.
   * @returns Um objeto com o IP e o User-Agent do cliente.
   */
  private getLoginDetails(req: Request): { ip: string; userAgent: string } {
    const forwardedFor = req.headers['x-forwarded-for'];
    let ip: string;

    if (typeof forwardedFor === 'string') {
      // O cabeçalho pode conter uma lista de IPs. O primeiro é o do cliente original.
      ip = forwardedFor.split(',')[0].trim();
    } else {
      // Fallback para req.ip, que pode ser o IP do proxy ou o do cliente.
      ip = req.ip || 'unknown';
    }

    const userAgent = req.headers['user-agent'] || 'unknown';

    return { ip, userAgent };
  }
}
