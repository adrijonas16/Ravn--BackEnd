import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: Record<string, any>;
  let paymentsService: Record<string, jest.Mock>;

  const clientUser = { id: 1, email: 'client@test.com', role: 'client' };
  const managerUser = { id: 2, email: 'manager@test.com', role: 'manager' };

  beforeEach(async () => {
    prisma = {
      cart: { findFirst: jest.fn() },
      address: { findFirst: jest.fn() },
      order: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      promoCode: { findUnique: jest.fn() },
      promoCodeRedemption: { count: jest.fn(), create: jest.fn() },
      orderStatusHistory: { create: jest.fn() },
      productVariant: { update: jest.fn(), findUnique: jest.fn() },
      inventoryMovement: { create: jest.fn() },
      notification: { create: jest.fn() },
      $transaction: jest.fn((fn) => fn(prisma)),
    };
    paymentsService = {
      refundOrderPayment: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prisma },
        { provide: PaymentsService, useValue: paymentsService },
      ],
    }).compile();

    service = module.get(OrdersService);
  });

  describe('create', () => {
    it('should throw BadRequestException if cart is empty', async () => {
      prisma.cart.findFirst.mockResolvedValue(null);
      await expect(service.create(1, { addressId: 1 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if cart has no items', async () => {
      prisma.cart.findFirst.mockResolvedValue({ id: 1, items: [] });
      await expect(service.create(1, { addressId: 1 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if address not found', async () => {
      prisma.cart.findFirst.mockResolvedValue({
        id: 1,
        items: [
          {
            productVariant: {
              stock: 10,
              price: 20,
              sku: 'A',
              product: { name: 'T', images: [] },
              size: { name: 'M' },
              color: { name: 'Red' },
            },
            productVariantId: 1,
            quantity: 1,
          },
        ],
      });
      prisma.address.findFirst.mockResolvedValue(null);
      await expect(service.create(1, { addressId: 999 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if stock insufficient', async () => {
      prisma.cart.findFirst.mockResolvedValue({
        id: 1,
        items: [
          {
            productVariant: {
              stock: 0,
              price: 20,
              sku: 'A',
              product: { name: 'T', images: [] },
              size: { name: 'M' },
              color: { name: 'Red' },
            },
            productVariantId: 1,
            quantity: 5,
          },
        ],
      });
      prisma.address.findFirst.mockResolvedValue({
        id: 1,
        recipientName: 'J',
        recipientPhone: '1',
        line1: 'st',
        city: 'c',
        countryCode: 'US',
      });
      await expect(service.create(1, { addressId: 1 })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should filter by userId for client role', async () => {
      prisma.order.findMany.mockResolvedValue([]);
      prisma.order.count.mockResolvedValue(0);

      await service.findAll(clientUser, { page: 1, limit: 20 });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 1 }),
        }),
      );
    });

    it('should not filter by userId for manager role', async () => {
      prisma.order.findMany.mockResolvedValue([]);
      prisma.order.count.mockResolvedValue(0);

      await service.findAll(managerUser, { page: 1, limit: 20 });

      const call = prisma.order.findMany.mock.calls[0][0];
      expect(call.where.userId).toBeUndefined();
    });

    it('should apply status filter', async () => {
      prisma.order.findMany.mockResolvedValue([]);
      prisma.order.count.mockResolvedValue(0);

      await service.findAll(clientUser, {
        page: 1,
        limit: 20,
        status: 'paid',
      });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ currentStatus: 'paid' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException for non-existent order', async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      await expect(service.findOne(999, clientUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if client views another users order', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 1,
        userId: 999,
        items: [],
        statusHistory: [],
        payments: [],
      });
      await expect(service.findOne(1, clientUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should allow manager to view any order', async () => {
      const order = {
        id: 1,
        userId: 999,
        items: [],
        statusHistory: [],
        payments: [],
      };
      prisma.order.findUnique.mockResolvedValue(order);
      const result = await service.findOne(1, managerUser);
      expect(result.id).toBe(1);
    });
  });

  describe('updateStatus', () => {
    it('should throw NotFoundException for non-existent order', async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      await expect(
        service.updateStatus({
          orderId: 999,
          status: 'processing' as any,
          user: managerUser,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid transition', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 1,
        currentStatus: 'pending',
      });
      await expect(
        service.updateStatus({
          orderId: 1,
          status: 'shipped' as any,
          user: managerUser,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if delivery person tries non-delivered status', async () => {
      const deliveryUser = { id: 3, email: 'd@t.com', role: 'delivery_person' };
      prisma.order.findUnique.mockResolvedValue({
        id: 1,
        currentStatus: 'shipped',
        assignedDeliveryUserId: 3,
      });
      await expect(
        service.updateStatus({
          orderId: 1,
          status: 'processing' as any,
          user: deliveryUser,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelOrder', () => {
    it('should throw BadRequestException if order already shipped', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 1,
        userId: 1,
        currentStatus: 'shipped',
      });
      await expect(
        service.cancelOrder({
          orderId: 1,
          user: clientUser,
          reason: 'changed mind',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if client cancels another users order', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 1,
        userId: 999,
        currentStatus: 'pending',
      });
      await expect(
        service.cancelOrder({
          orderId: 1,
          user: clientUser,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should refund paid order before cancelling it', async () => {
      prisma.order.findUnique.mockResolvedValueOnce({
        id: 1,
        userId: 1,
        currentStatus: 'paid',
        user: { id: 1, email: 'client@test.com' },
      });
      prisma.order.findUnique.mockResolvedValueOnce({
        id: 1,
        userId: 1,
        currentStatus: 'paid',
        user: { id: 1, email: 'client@test.com' },
      });
      prisma.order.update.mockResolvedValue({
        id: 1,
        currentStatus: 'cancelled',
        items: [{ productVariantId: 5, quantity: 2 }],
      });
      prisma.productVariant.findUnique.mockResolvedValue({ stock: 12 });

      await service.cancelOrder({
        orderId: 1,
        user: clientUser,
        reason: 'changed mind',
      });

      expect(paymentsService.refundOrderPayment).toHaveBeenCalledWith(1);
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ currentStatus: 'cancelled' }),
        }),
      );
    });
  });
});
