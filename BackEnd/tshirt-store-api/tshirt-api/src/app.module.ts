// @Module: decorador que define un módulo en NestJS (agrupa controladores, servicios, etc.)
import { Module } from '@nestjs/common';
// ConfigModule: permite leer variables de entorno desde .env en toda la app
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { LoggerModule } from 'nestjs-pino';
// ThrottlerModule: protección contra abuso (rate limiting) — limita peticiones por IP
import { ThrottlerModule } from '@nestjs/throttler';
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

// Este es el MÓDULO RAÍZ — aquí se registran todos los módulos de la aplicación
// NestJS construye un grafo de dependencias a partir de este módulo
@Module({
  imports: [
    // isGlobal: true — hace que ConfigService esté disponible en TODOS los módulos sin reimportarlo
    ConfigModule.forRoot({ isGlobal: true }),
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
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: Number(config.get('REDIS_PORT', 6379)),
          maxRetriesPerRequest: null,
        },
      }),
    }),
    // Rate limiting: máximo 10 peticiones por IP cada 60 segundos (60000 ms)
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
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
})
export class AppModule {}
