import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OrdersModule } from '../orders/orders.module';
import { DeliveryController } from './delivery.controller';

@Module({
  imports: [PrismaModule, OrdersModule],
  controllers: [DeliveryController],
})
export class DeliveryModule {}
