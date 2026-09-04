import { BadRequestException } from '@nestjs/common';
import { DiscountType } from '@prisma/client';
import { PromoCodesService } from './promo-codes.service';

describe('PromoCodesService', () => {
  let service: PromoCodesService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      cart: { findFirst: jest.fn() },
      promoCode: {
        count: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      promoCodeRedemption: { count: jest.fn() },
    };
    service = new PromoCodesService(prisma);
  });

  describe('previewForCart', () => {
    beforeEach(() => {
      prisma.cart.findFirst.mockResolvedValue({
        items: [
          {
            quantity: 2,
            productVariant: { price: 25 },
          },
        ],
      });
    });

    it('calculates a percentage discount for the active cart', async () => {
      prisma.promoCode.findUnique.mockResolvedValue({
        id: 1,
        code: 'SAVE10',
        discountType: DiscountType.percentage,
        discountValue: 10,
        expiresAt: new Date(Date.now() + 86_400_000),
        isActive: true,
        minimumPurchaseAmount: null,
        usageLimit: 5,
      });
      prisma.promoCodeRedemption.count.mockResolvedValue(1);

      await expect(
        service.previewForCart(3, { code: ' save10 ' }),
      ).resolves.toEqual({
        code: 'SAVE10',
        discountType: DiscountType.percentage,
        discountValue: 10,
        subtotal: 50,
        discountAmount: 5,
        totalAmount: 45,
      });
    });

    it('rejects invalid promo codes', async () => {
      prisma.promoCode.findUnique.mockResolvedValue(null);

      await expect(
        service.previewForCart(3, { code: 'missing' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
