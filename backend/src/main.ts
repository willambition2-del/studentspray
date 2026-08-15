import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { parseCorsOrigins } from './config/environment';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  app.useLogger(new Logger());
  app.enableShutdownHooks();
  app.setGlobalPrefix('api/v1');
  const requestIdMiddleware = new RequestIdMiddleware();
  app.use(requestIdMiddleware.use.bind(requestIdMiddleware));
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());
  app.enableCors({
    origin: parseCorsOrigins(config.getOrThrow<string>('CORS_ORIGINS')),
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());

  const swaggerEnabled = config.get<boolean>('SWAGGER_ENABLED', false) && config.get('NODE_ENV') !== 'production';
  if (swaggerEnabled) {
    const document = SwaggerModule.createDocument(app, new DocumentBuilder()
      .setTitle('Quran Forum API')
      .setDescription('Production backend foundation for the Quran Forum platform')
      .setVersion('1.0')
      .build());
    SwaggerModule.setup('api/docs', app, document, { jsonDocumentUrl: 'api/docs-json' });
  }

  if (config.get<boolean>('TRUST_PROXY', false)) app.set('trust proxy', 1);

  const port = config.getOrThrow<number>('PORT');
  await app.listen(port, '0.0.0.0');
  logger.log(`Quran Forum API listening on port ${port}`);
}

void bootstrap();
