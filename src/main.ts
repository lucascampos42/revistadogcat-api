import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { apiReference } from '@scalar/nestjs-api-reference';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { GlobalExceptionFilter } from './core/filters';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });
  const port = process.env.PORT ?? 3000;

  app.useGlobalFilters(new GlobalExceptionFilter());

  const allowedOrigins = [
    'http://localhost:4200',
    'http://localhost:4201',
    'https://revistadogcat.com.br',
    'http://revistadogcat.com.br',
    'https://www.revistadogcat.com.br',
    'http://www.revistadogcat.com.br',
  ];

  if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
  }

  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
    ],
    exposedHeaders: ['Content-Length', 'X-Total-Count'],
    optionsSuccessStatus: 200,
    preflightContinue: false,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidUnknownValues: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const uploadDirectories = [
    'uploads/avatars',
    'uploads/artigos',
    'uploads/articles',
    'uploads/dogs/profile',
    'uploads/dogs/lateral',
    'uploads/dogs/pedigree',
  ];

  uploadDirectories.forEach((dir) => {
    const fullPath = join(__dirname, '..', dir);
    if (!existsSync(fullPath)) {
      mkdirSync(fullPath, { recursive: true });
      Logger.log(`Diretório de uploads criado: ${fullPath}`);
    }
  });

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  const config = new DocumentBuilder()
    .setTitle('NestJS Boilerplate')
    .setDescription('The NestJS Boilerplate API description')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

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
  Logger.log(`Listening on 0.0.0.0:${port}`);
}
bootstrap();
