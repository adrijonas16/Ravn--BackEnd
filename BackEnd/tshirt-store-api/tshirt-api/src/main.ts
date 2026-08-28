// NestFactory: la fábrica que crea la instancia de la aplicación NestJS
import { NestFactory } from '@nestjs/core';
// ValidationPipe: valida automáticamente los datos que llegan en cada request
import { ValidationPipe } from '@nestjs/common';
// Swagger: genera documentación interactiva de la API (como Postman pero automático)
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
// Helmet: agrega headers de seguridad HTTP automáticamente (protege contra XSS, clickjacking, etc.)
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';

// bootstrap(): función principal que arranca toda la aplicación
async function bootstrap() {
  // Crea la app NestJS a partir del módulo raíz (AppModule)
  const app = await NestFactory.create(AppModule, {
    // rawBody: necesario para verificar la firma del webhook de Stripe
    // Sin esto, Stripe no puede confirmar que el webhook es auténtico
    rawBody: true,
  });

  // Helmet: middleware que añade headers HTTP de seguridad automáticamente
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
  // CORS: permite que el frontend (en otro dominio/puerto) haga peticiones a esta API
  app.enableCors();
  // Prefijo global: todas las rutas empiezan con /api/v1 (ej: /api/v1/products)
  app.setGlobalPrefix('api/v1');
  // Filtro global de excepciones: atrapa TODOS los errores y los formatea en JSON uniforme
  app.useGlobalFilters(new GlobalExceptionFilter());
  // ValidationPipe global: valida los DTOs (Data Transfer Objects) en cada request
  app.useGlobalPipes(
    new ValidationPipe({
      // whitelist: elimina propiedades que NO están definidas en el DTO
      whitelist: true,
      // forbidNonWhitelisted: lanza error si envían propiedades no permitidas
      forbidNonWhitelisted: true,
      // transform: convierte los datos del request al tipo del DTO automáticamente
      transform: true,
      // enableImplicitConversion: convierte strings a numbers/booleans según el tipo del DTO
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Configuración de Swagger (documentación interactiva de la API)
  const config = new DocumentBuilder()
    .setTitle('T-Shirt Store API')
    .setDescription('REST API for the T-Shirt Store')
    .setVersion('1.0')
    // addBearerAuth: añade el botón "Authorize" en Swagger para enviar el token JWT
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  // La documentación queda disponible en /api/docs
  SwaggerModule.setup('api/docs', app, document);

  // Inicia el servidor en el puerto definido en .env o 3000 por defecto
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
void bootstrap();
