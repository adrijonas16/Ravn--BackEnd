import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
}
