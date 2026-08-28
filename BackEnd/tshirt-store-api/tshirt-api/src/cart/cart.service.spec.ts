import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CartService } from './cart.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CartService', () => {
  let service: CartService;
  let prisma: Record<string, any>;

  beforeEach(async () => {
    prisma = {
      cart: { findFirst: jest.fn(), create: jest.fn() },
      cartItem: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      productVariant: { findUnique: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [CartService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(CartService);
  });

  describe('addItem', () => {
    it('should throw NotFoundException for non-existent SKU', async () => {
      prisma.productVariant.findUnique.mockResolvedValue(null);
      await expect(
        service.addItem(1, { productVariantId: 999, quantity: 1 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for insufficient stock', async () => {
      prisma.productVariant.findUnique.mockResolvedValue({
        id: 1,
        stock: 2,
        isActive: true,
        product: { deletedAt: null },
      });
      await expect(
        service.addItem(1, { productVariantId: 1, quantity: 5 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException for inactive SKU', async () => {
      prisma.productVariant.findUnique.mockResolvedValue({
        id: 1,
        stock: 10,
        isActive: false,
        product: { deletedAt: null },
      });
      await expect(
        service.addItem(1, { productVariantId: 1, quantity: 1 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateItem', () => {
    it('should throw NotFoundException for non-existent cart item', async () => {
      prisma.cart.findFirst.mockResolvedValue({ id: 1 });
      prisma.cartItem.findFirst.mockResolvedValue(null);
      await expect(
        service.updateItem({
          userId: 1,
          itemId: 999,
          dto: { quantity: 2 },
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if quantity exceeds stock', async () => {
      prisma.cart.findFirst.mockResolvedValue({ id: 1 });
      prisma.cartItem.findFirst.mockResolvedValue({
        id: 1,
        cartId: 1,
        productVariant: { stock: 3 },
      });
      await expect(
        service.updateItem({
          userId: 1,
          itemId: 1,
          dto: { quantity: 10 },
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeItem', () => {
    it('should throw NotFoundException for non-existent item', async () => {
      prisma.cart.findFirst.mockResolvedValue({ id: 1 });
      prisma.cartItem.findFirst.mockResolvedValue(null);
      await expect(service.removeItem(1, 999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
