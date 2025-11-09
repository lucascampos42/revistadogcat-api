import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthModule } from './application/auth/auth.module';
import { UserModule } from './application/user/user.module';
import { PrismaService } from './core/config/prisma.service';

import { HomeModule } from './application/home/home.module';
import { ArtigoModule } from './application/artigo/artigo.module';
import { CadastroCaoModule } from './application/cadastro-cao/cadastro-cao.module';
import { ConfigModule } from '@nestjs/config';
import { MailModule } from './core/mail/mail.module';
import mailConfig from './core/mail/mail.config';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { GlobalAuthGuard } from './core/guards/global-auth.guard';
import { GlobalExceptionFilter } from './core/filters';
import { ResponseFormatInterceptor } from './core/interceptors/response-format.interceptor';
import { JwtModule } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import { RacaModule } from './application/raca/raca.module';
import { EdicaoModule } from './application/edicao/edicao.module';
import { VotacaoModule } from './application/votacao/votacao.module';
import { DashboardModule } from './application/dashboard/dashboard.module';

@Module({
  imports: [
    DashboardModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [mailConfig],
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'default-secret',
      signOptions: {
        expiresIn: (process.env.JWT_ACCESS_TTL ||
          '1h') as JwtSignOptions['expiresIn'],
      },
    }),
    AuthModule,
    UserModule,
    HomeModule,
    ArtigoModule,
    CadastroCaoModule,
    RacaModule,
    EdicaoModule,
    VotacaoModule,
    MailModule,
  ],
  controllers: [],
  providers: [
    PrismaService,
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
  configure(consumer: MiddlewareConsumer) {}
}
