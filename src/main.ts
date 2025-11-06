import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';
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

  // Ativar o filtro de exceções global
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Configurar CORS - apenas origens específicas permitidas
  const allowedOrigins = [
    'http://localhost:4200',
    'http://localhost:4201',
    'https://revistadogcat.com.br',
    'http://revistadogcat.com.br',
    'https://www.revistadogcat.com.br',
    'http://www.revistadogcat.com.br',
  ];

  // Adicionar origens do ambiente se definidas
  if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
  }

  app.enableCors({
    origin: (origin, callback) => {
      // Permitir requisições sem origin (ex: mobile apps, Postman, testes)
      if (!origin) return callback(null, true);

      // Verificar se a origem está na lista permitida
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Verificar se é um subdomínio do revistadogcat.com.br
      if (origin.endsWith('.revistadogcat.com.br')) {
        Logger.log(`CORS permitiu subdomínio: ${origin}`);
        return callback(null, true);
      }

      Logger.warn(`CORS bloqueou origem não permitida: ${origin}`);
      return callback(new Error('Não permitido pelo CORS'), false);
    },
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

  // Criar diretórios de uploads se não existirem
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

  // Configurar arquivos estáticos
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
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
  Logger.log(`Listening on 0.0.0.0:${port}`);
}
bootstrap();
