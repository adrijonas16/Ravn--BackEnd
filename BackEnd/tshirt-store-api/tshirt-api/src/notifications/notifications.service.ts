import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LowStockNotificationJobDto } from './dto/low-stock-notification-job.dto';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: number, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [data, totalItems] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
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
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  async createLowStockNotifications(payload: LowStockNotificationJobDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: payload.productId },
      select: {
        id: true,
        images: {
          where: { isPrimary: true },
          select: { publicUrl: true },
          take: 1,
        },
      },
    });
    if (!product) return;

    const interestedUsers = await this.prisma.user.findMany({
      where: {
        status: 'active',
        productLikes: { some: { productId: payload.productId } },
        orders: {
          none: {
            items: {
              some: {
                productVariant: { productId: payload.productId },
              },
            },
          },
        },
      },
      select: { id: true, email: true },
    });

    if (interestedUsers.length === 0) return;

    await this.prisma.notification.createMany({
      data: interestedUsers.map((user) => ({
        userId: user.id,
        productId: payload.productId,
        productVariantId: payload.productVariantId,
        type: 'low_stock',
        recipientEmail: user.email,
      })),
    });
  }
}
