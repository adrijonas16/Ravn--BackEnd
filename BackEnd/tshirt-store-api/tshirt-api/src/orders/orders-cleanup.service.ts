import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';
import { ABANDONED_ORDER_HOURS } from '../common/constants/order.constants';

@Injectable()
export class OrdersCleanupService {
  private readonly logger = new Logger(OrdersCleanupService.name);

  constructor(private prisma: PrismaService) {}

  // Corre cada 15 minutos — busca órdenes pending más viejas que ABANDONED_ORDER_HOURS
  // y las cancela, restaurando stock y liberando promo codes
  @Cron('0 */15 * * * *')
  async cancelAbandonedOrders() {
    const cutoff = new Date(
      Date.now() - ABANDONED_ORDER_HOURS * 60 * 60 * 1000,
    );

    const abandonedOrders = await this.prisma.order.findMany({
      where: {
        currentStatus: OrderStatus.pending,
        createdAt: { lt: cutoff },
      },
      include: { items: true },
    });

    if (abandonedOrders.length === 0) return;

    this.logger.log(
      `Found ${abandonedOrders.length} abandoned order(s) older than ${ABANDONED_ORDER_HOURS}h`,
    );

    for (const order of abandonedOrders) {
      try {
        await this.prisma.$transaction(async (tx) => {
          // Cancelar orden
          await tx.order.update({
            where: { id: order.id },
            data: {
              currentStatus: OrderStatus.cancelled,
              cancelledAt: new Date(),
            },
          });

          await tx.orderStatusHistory.create({
            data: {
              orderId: order.id,
              fromStatus: OrderStatus.pending,
              toStatus: OrderStatus.cancelled,
              reason: `Auto-cancelled: no payment after ${ABANDONED_ORDER_HOURS} hours`,
            },
          });

          // Restaurar stock
          for (const item of order.items) {
            const sku = await tx.productVariant.update({
              where: { id: item.productVariantId },
              data: { stock: { increment: item.quantity } },
            });
            await tx.inventoryMovement.create({
              data: {
                productVariantId: item.productVariantId,
                orderId: order.id,
                movementType: 'cancellation',
                quantityChange: item.quantity,
                stockAfter: sku.stock,
              },
            });
          }

          // Liberar promo code
          await tx.promoCodeRedemption.deleteMany({
            where: { orderId: order.id },
          });
        });

        this.logger.log(
          `Cancelled abandoned order ${order.orderNumber} (${order.id})`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to cancel order ${order.id}: ${error instanceof Error ? error.message : error}`,
        );
      }
    }
  }
}
