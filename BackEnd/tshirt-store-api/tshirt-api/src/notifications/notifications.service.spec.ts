import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: Record<string, any>;

  beforeEach(async () => {
    prisma = {
      notification: {
        findMany: jest.fn(),
        createMany: jest.fn(),
      },
      product: {
        findUnique: jest.fn(),
      },
      user: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(NotificationsService);
  });

  it('creates low-stock notifications for users who liked and have not purchased the product', async () => {
    prisma.product.findUnique.mockResolvedValue({
      id: 10,
      images: [{ publicUrl: 'https://cdn.test/product.jpg' }],
    });
    prisma.user.findMany.mockResolvedValue([
      { id: 1, email: 'client@test.com' },
    ]);

    await service.createLowStockNotifications({
      productId: 10,
      productVariantId: 20,
      stock: 3,
    });

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: {
        status: 'active',
        productLikes: { some: { productId: 10 } },
        orders: {
          none: {
            items: {
              some: {
                productVariant: { productId: 10 },
              },
            },
          },
        },
      },
      select: { id: true, email: true },
    });
    expect(prisma.notification.createMany).toHaveBeenCalledWith({
      data: [
        {
          userId: 1,
          productId: 10,
          productVariantId: 20,
          type: 'low_stock',
          recipientEmail: 'client@test.com',
        },
      ],
    });
  });

  it('does not create low-stock notifications when no liked non-purchasers exist', async () => {
    prisma.product.findUnique.mockResolvedValue({ id: 10, images: [] });
    prisma.user.findMany.mockResolvedValue([]);

    await service.createLowStockNotifications({
      productId: 10,
      productVariantId: 20,
      stock: 3,
    });

    expect(prisma.notification.createMany).not.toHaveBeenCalled();
  });
});
