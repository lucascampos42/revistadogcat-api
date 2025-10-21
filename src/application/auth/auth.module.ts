import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../../core/guards/jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailModule } from '../../core/mail/mail.module';
import { PrismaModule } from '../../core/config/prisma.module';
import { AuthRepository } from './repositories/auth.repository';
import { AUTH_REPOSITORY_TOKEN } from './repositories/auth.repository.interface';

@Module({
  imports: [
    PrismaModule,
    ConfigModule, // Garante que o ConfigService esteja disponível para injeção
    UserModule,
    MailModule,
    PassportModule,
    // Configuração assíncrona do JwtModule para usar o ConfigService
    JwtModule.registerAsync({
      imports: [ConfigModule], // Importa o ConfigModule para o escopo do JwtModule
      inject: [ConfigService], // Injeta o ConfigService na factory
      useFactory: (configService: ConfigService) => ({
        // Define o segredo padrão para o Access Token
        secret: configService.get<string>(
          'JWT_SECRET',
          'default-access-secret',
        ),
        signOptions: {
          expiresIn: configService.get<string>(
            'JWT_TTL',
            '4h',
          ) as JwtSignOptions['expiresIn'],
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    {
      provide: AUTH_REPOSITORY_TOKEN,
      useClass: AuthRepository,
    },
  ],
})
export class AuthModule {}
