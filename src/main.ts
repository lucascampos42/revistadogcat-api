import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { apiReference } from '@scalar/nestjs-api-reference';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const port = process.env.PORT ?? 3099;

  // Configurar CORS
  app.enableCors({
    origin: [
      'http://localhost:4200',
      'http://localhost:4201',
      'http://127.0.0.1:4200',
      'https://revista.codesdevs.com.br',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
    ],
    credentials: true,
    optionsSuccessStatus: 200,
    preflightContinue: false,
  });

  // Criar diretório de uploads se não existir
  const uploadsPath = join(process.cwd(), 'uploads', 'avatars');
  if (!existsSync(uploadsPath)) {
    mkdirSync(uploadsPath, { recursive: true });
    Logger.log(`Diretório de uploads criado: ${uploadsPath}`);
  }

  // Configurar servir arquivos estáticos
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // Configurar Swagger/OpenAPI
  const config = new DocumentBuilder()
    .setTitle('NestJS Boilerplate')
    .setDescription('The NestJS Boilerplate API description')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Add Scalar middleware
  app.use(
    '/reference',
    apiReference({
      spec: {
        content: document,
      },
    }),
  );

  await app.listen(port);
  Logger.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
