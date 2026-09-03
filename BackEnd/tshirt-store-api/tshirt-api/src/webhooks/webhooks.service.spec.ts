import { BadRequestException } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { WebhooksService } from './webhooks.service';

jest.mock('@nestjs/bullmq', () => ({
  InjectQueue: () => () => undefined,
}));

describe('WebhooksService', () => {
  let service: WebhooksService;
  let prisma: Record<string, any>;
  let tx: Record<string, any>;
  let notificationsQueue: Record<string, any>;

  beforeEach(() => {
    tx = {
      order: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      orderStatusHistory: {
        create: jest.fn(),
      },
      payment: {
        updateMany: jest.fn(),
      },
      productVariant: {
        update: jest.fn(),
      },
      inventoryMovement: {
        create: jest.fn(),
      },
      user: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      notification: {
        create: jest.fn(),
        createMany: jest.fn(),
      },
    };
    prisma = {
      $transaction: jest.fn((callback) => callback(tx)),
      stripeWebhookEvent: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    notificationsQueue = {
      enqueueLowStockNotification: jest.fn(),
    };

    service = new WebhooksService(
      prisma as any,
      {
        get: jest.fn((key: string, fallback: string) => fallback),
      } as any,
      notificationsQueue as any,
    );
  });

  it('should mark successful payment, decrement stock, and create inventory movement', async () => {
    tx.order.findUnique.mockResolvedValue({
      id: 1,
      currentStatus: 'pending',
      user: { id: 7, email: 'client@test.com' },
      items: [
        {
          productVariantId: 10,
          productVariant: { stock: 8, productId: 20 },
          quantity: 2,
          skuCode: 'TEE-BLK-M',
        },
      ],
    });
    tx.productVariant.update.mockResolvedValue({ stock: 6 });

    await (service as any).processPaymentSuccess(1, 'cs_test_123');

    expect(tx.order.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { currentStatus: 'paid' },
    });
    expect(tx.payment.updateMany).toHaveBeenCalledWith({
      where: { orderId: 1, providerPaymentId: 'cs_test_123' },
      data: { status: PaymentStatus.succeeded, paidAt: expect.any(Date) },
    });
    expect(tx.notification.create).toHaveBeenCalledWith({
      data: {
        userId: 7,
        type: 'order_paid',
        recipientEmail: 'client@test.com',
      },
    });
    expect(tx.productVariant.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { stock: { decrement: 2 } },
    });
    expect(tx.inventoryMovement.create).toHaveBeenCalledWith({
      data: {
        productVariantId: 10,
        orderId: 1,
        movementType: 'sale',
        quantityChange: -2,
        stockAfter: 6,
      },
    });
    expect(
      notificationsQueue.enqueueLowStockNotification,
    ).not.toHaveBeenCalled();
  });

  it('should enqueue low stock notifications after stock crosses threshold', async () => {
    tx.order.findUnique.mockResolvedValue({
      id: 1,
      currentStatus: 'pending',
      user: { id: 7, email: 'client@test.com' },
      items: [
        {
          productVariantId: 10,
          productVariant: { stock: 4, productId: 20 },
          quantity: 2,
          skuCode: 'TEE-BLK-M',
        },
      ],
    });
    tx.productVariant.update.mockResolvedValue({ stock: 2 });

    await (service as any).processPaymentSuccess(1, 'cs_test_123');

    expect(notificationsQueue.enqueueLowStockNotification).toHaveBeenCalledWith(
      {
        productId: 20,
        productVariantId: 10,
        stock: 2,
      },
    );
  });

  it('should fail payment and not decrement stock when inventory is insufficient', async () => {
    tx.order.findUnique.mockResolvedValue({
      id: 1,
      currentStatus: 'pending',
      user: { id: 7, email: 'client@test.com' },
      items: [
        {
          productVariantId: 10,
          productVariant: { stock: 1, productId: 20 },
          quantity: 2,
          skuCode: 'TEE-BLK-M',
        },
      ],
    });

    await expect(
      (service as any).processPaymentSuccess(1, 'cs_test_123'),
    ).rejects.toThrow(BadRequestException);

    expect(tx.payment.updateMany).toHaveBeenCalledWith({
      where: { orderId: 1, providerPaymentId: 'cs_test_123' },
      data: { status: PaymentStatus.failed },
    });
    expect(tx.order.update).not.toHaveBeenCalled();
    expect(tx.productVariant.update).not.toHaveBeenCalled();
    expect(tx.inventoryMovement.create).not.toHaveBeenCalled();
  });

  it('should mark failed payment without changing stock or order status', async () => {
    tx.order.findUnique.mockResolvedValue({
      id: 1,
      currentStatus: 'pending',
      user: { id: 7, email: 'client@test.com' },
    });

    await (service as any).processPaymentFailure(
      1,
      'pi_test_123',
      PaymentStatus.failed,
      false,
      'Stripe payment intent failed',
    );

    expect(tx.payment.updateMany).toHaveBeenCalledWith({
      where: { orderId: 1, providerPaymentId: 'pi_test_123' },
      data: { status: PaymentStatus.failed },
    });
    expect(tx.order.update).not.toHaveBeenCalled();
    expect(tx.productVariant.update).not.toHaveBeenCalled();
  });

  it('should cancel pending order when checkout session expires', async () => {
    tx.order.findUnique.mockResolvedValue({
      id: 1,
      currentStatus: 'pending',
      user: { id: 7, email: 'client@test.com' },
    });

    await (service as any).processPaymentFailure(
      1,
      'cs_test_123',
      PaymentStatus.cancelled,
      true,
      'Stripe checkout session expired',
    );

    expect(tx.payment.updateMany).toHaveBeenCalledWith({
      where: { orderId: 1, providerPaymentId: 'cs_test_123' },
      data: { status: PaymentStatus.cancelled },
    });
    expect(tx.order.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        currentStatus: 'cancelled',
        cancelledAt: expect.any(Date),
      },
    });
    expect(tx.productVariant.update).not.toHaveBeenCalled();
    expect(tx.inventoryMovement.create).not.toHaveBeenCalled();
  });
});
