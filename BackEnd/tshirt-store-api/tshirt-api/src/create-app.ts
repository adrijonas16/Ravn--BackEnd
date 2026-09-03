import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';

function parseCorsOrigins(origins?: string) {
  return origins
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export async function createApp() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));

  app.use(
    helmet({
      hsts: false,
      contentSecurityPolicy: {
        directives: {
          upgradeInsecureRequests: null,
        },
      },
    }),
  );
  const configService = app.get(ConfigService);
  const allowedOrigins = parseCorsOrigins(
    configService.get<string>('CORS_ORIGINS'),
  );
  app.enableCors({
    origin: allowedOrigins?.length ? allowedOrigins : true,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature'],
  });
  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('T-Shirt Store API')
    .setDescription('REST API for the T-Shirt Store')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  return app;
}
