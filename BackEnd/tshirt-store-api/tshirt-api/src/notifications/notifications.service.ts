import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LowStockNotificationJobDto } from './dto/low-stock-notification-job.dto';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  findAll(userId: number) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { id: true, name: true, slug: true } },
        productVariant: {
          select: {
            id: true,
            sku: true,
            stock: true,
            size: { select: { name: true } },
            color: { select: { name: true } },
          },
        },
      },
    });
  }

  async createLowStockNotifications(payload: LowStockNotificationJobDto) {
    const managers = await this.prisma.user.findMany({
      where: { role: { name: 'manager' }, status: 'active' },
      select: { id: true, email: true },
    });

    if (managers.length === 0) return;

    await this.prisma.notification.createMany({
      data: managers.map((manager) => ({
        userId: manager.id,
        productId: payload.productId,
        productVariantId: payload.productVariantId,
        type: 'low_stock',
        recipientEmail: manager.email,
      })),
    });
  }
}
