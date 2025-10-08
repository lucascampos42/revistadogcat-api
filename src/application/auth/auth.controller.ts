import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  Get,
  UseGuards,
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
  RefreshTokenDto,
  AuthResponseDto,
  AuthUserDto,
} from './dto';
import { IsPublic } from '../../core/decorators/is-public.decorator';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { User } from '../../core/decorators/get-user.decorator';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @IsPublic()
  @ApiOperation({ summary: 'Fazer login no sistema' })
  @ApiResponse({
    status: 200,
    description:
      'Login realizado com sucesso - retorna token de acesso e dados do usuário',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados de login inválidos' })
  @ApiResponse({ status: 401, description: 'Credenciais incorretas' })
  signIn(@Body() loginDto: LoginDto, @Req() req: Request) {
    const loginDetails = this.getLoginDetails(req);
    return this.authService.signIn(
      loginDto.identification,
      loginDto.password,
      loginDetails,
    );
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Renovar token de acesso usando o refresh token' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Refresh token inválido ou expirado',
  })
  refreshToken(
    @User('userId') userId: string,
    @Body() body: RefreshTokenDto,
  ): Promise<AuthResponseDto> {
    return this.authService.refreshToken(userId, body.refresh_token);
  }

  @Post('register')
  @IsPublic()
  @ApiOperation({ summary: 'Registrar novo usuário' })
  @ApiResponse({
    status: 201,
    description: 'Usuário registrado e ativado com sucesso',
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos fornecidos' })
  @ApiResponse({
    status: 409,
    description: 'Usuário já existe (email, username ou CPF duplicado)',
  })
  signUp(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @IsPublic()
  @ApiOperation({ summary: 'Solicitar redefinição de senha' })
  @ApiResponse({
    status: 200,
    description: 'Token de redefinição gerado e enviado por email',
  })
  @ApiResponse({ status: 400, description: 'Email inválido' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
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

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter perfil do usuário autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Perfil do usuário retornado com sucesso',
    type: AuthUserDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Token de acesso inválido ou expirado',
  })
  getProfile(@User() user: AuthUserDto) {
    return user;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fazer logout e invalidar tokens' })
  @ApiResponse({ status: 200, description: 'Logout realizado com sucesso' })
  @ApiResponse({
    status: 401,
    description: 'Token de acesso inválido ou expirado',
  })
  async logout(@User('userId') userId: string): Promise<{ message: string }> {
    await this.authService.logout(userId);
    return { message: 'Logout realizado com sucesso.' };
  }

  private getLoginDetails(req: Request): { ip: string; userAgent: string } {
    const forwardedFor = req.headers['x-forwarded-for'];
    let ip: string;

    if (typeof forwardedFor === 'string') {
      ip = forwardedFor.split(',')[0].trim();
    } else {
      ip = req.ip || 'unknown';
    }

    const userAgent = req.headers['user-agent'] || 'unknown';

    return { ip, userAgent };
  }
}
