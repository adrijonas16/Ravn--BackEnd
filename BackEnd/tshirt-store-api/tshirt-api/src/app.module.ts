// @Module: decorador que define un módulo en NestJS (agrupa controladores, servicios, etc.)
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
// ConfigModule: permite leer variables de entorno desde .env en toda la app
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { LoggerModule } from 'nestjs-pino';
// ThrottlerModule: protección contra abuso (rate limiting) — limita peticiones por IP
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
// CaslModule: sistema de permisos basado en roles (quién puede hacer qué)
import { CaslModule } from './casl/casl.module';
import { AuthModule } from './auth/auth.module';
import { AddressesModule } from './addresses/addresses.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { LikesModule } from './likes/likes.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { PromoCodesModule } from './promo-codes/promo-codes.module';
import { DeliveryModule } from './delivery/delivery.module';
// WebhooksModule: recibe notificaciones de Stripe cuando un pago se completa
import { WebhooksModule } from './webhooks/webhooks.module';
import { NotificationsModule } from './notifications/notifications.module';
import { validateEnv } from './config/env.validation';

// Este es el MÓDULO RAÍZ — aquí se registran todos los módulos de la aplicación
// NestJS construye un grafo de dependencias a partir de este módulo
@Module({
  imports: [
    // isGlobal: true — hace que ConfigService esté disponible en TODOS los módulos sin reimportarlo
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        redact: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.body.password',
          'req.body.newPassword',
          'req.body.refreshToken',
          'res.headers["set-cookie"]',
        ],
      },
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');
        if (redisUrl) {
          const parsedUrl = new URL(redisUrl);
          return {
            connection: {
              host: parsedUrl.hostname,
              port: Number(parsedUrl.port || 6379),
              username: parsedUrl.username || undefined,
              password: parsedUrl.password || undefined,
              maxRetriesPerRequest: null,
            },
          };
        }

        return {
          connection: {
            host: config.get('REDIS_HOST', 'localhost'),
            port: Number(config.get('REDIS_PORT', 6379)),
            maxRetriesPerRequest: null,
          },
        };
      },
    }),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60000, limit: 1000 }]),
    // PrismaModule: acceso a la base de datos via Prisma ORM
    PrismaModule,
    CaslModule,
    AuthModule,
    AddressesModule,
    CategoriesModule,
    ProductsModule,
    LikesModule,
    CartModule,
    OrdersModule,
    PaymentsModule,
    PromoCodesModule,
    DeliveryModule,
    WebhooksModule,
    NotificationsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
