import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthModule } from './application/auth/auth.module';
import { UserModule } from './application/user/user.module';
import { EnderecoModule } from './application/endereco/endereco.module';
import { PrismaService } from './core/config/prisma.service';
import { LogModule } from './application/log/log.module';
import { LoggerMiddleware } from './application/log/middleware/log.middleware';
import { HomeModule } from './application/home/home.module';
import { ArtigoModule } from './application/artigo/artigo.module';
import { CadastroCaoModule } from './application/cadastro-cao/cadastro-cao.module';
import { ConfigModule } from '@nestjs/config';
import { MailModule } from './core/mail/mail.module';
import mailConfig from './core/mail/mail.config';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { GlobalAuthGuard } from './core/guards/global-auth.guard';
import { GlobalExceptionFilter } from './core/filters/global-exception.filter';
import { ResponseFormatInterceptor } from './core/interceptors/response-format.interceptor';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { RacaModule } from './application/raca/raca.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [mailConfig],
    }),
    // Aumentar os limites para facilitar o desenvolvimento
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 segundo
        limit: 30, // ANTES: 3
      },
      {
        name: 'medium',
        ttl: 10000, // 10 segundos
        limit: 200, // ANTES: 20
      },
      {
        name: 'long',
        ttl: 60000, // 1 minuto
        limit: 100,
      },
      {
        name: 'auth',
        ttl: 60000, // 1 minuto
        limit: 10, // ANTES: 5
      },
    ]),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'default-secret',
      signOptions: { expiresIn: process.env.JWT_ACCESS_TTL || '1h' },
    }),
    AuthModule,
    UserModule,
    EnderecoModule,
    LogModule,
    HomeModule,
    ArtigoModule,
    CadastroCaoModule,
    RacaModule,
    MailModule,
  ],
  controllers: [],
  providers: [
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: GlobalAuthGuard,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseFormatInterceptor,
    },
  ],
  exports: [PrismaService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // A linha abaixo foi comentada para desativar o middleware de log customizado
    // e restaurar os logs de requisição padrão do NestJS.
    // consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
