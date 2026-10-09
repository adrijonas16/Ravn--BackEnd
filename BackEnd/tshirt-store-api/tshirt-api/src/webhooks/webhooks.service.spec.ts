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
        findUnique: jest.fn(),
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
        findFirst: jest.fn().mockResolvedValue(null),
      },
      promoCodeRedemption: {
        deleteMany: jest.fn(),
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

  it('should mark successful payment and update order status (stock already reserved)', async () => {
    // Stock ya fue decrementado al crear la orden — el webhook solo cambia estado
    tx.order.findUnique.mockResolvedValue({
      id: 1,
      currentStatus: 'pending',
      user: { id: 7, email: 'client@test.com' },
      items: [
        {
          productVariantId: 10,
          productVariant: { stock: 6, productId: 20 },
          quantity: 2,
          skuCode: 'TEE-BLK-M',
        },
      ],
    });
    tx.productVariant.findUnique.mockResolvedValue({ stock: 6 });

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
    // Stock NO se decrementa aquí — ya fue reservado al crear la orden
    expect(tx.productVariant.update).not.toHaveBeenCalled();
    expect(tx.inventoryMovement.create).not.toHaveBeenCalled();
    expect(
      notificationsQueue.enqueueLowStockNotification,
    ).not.toHaveBeenCalled();
  });

  it('should enqueue low stock notifications when stock is below threshold', async () => {
    tx.order.findUnique.mockResolvedValue({
      id: 1,
      currentStatus: 'pending',
      user: { id: 7, email: 'client@test.com' },
      items: [
        {
          productVariantId: 10,
          productVariant: { stock: 2, productId: 20 },
          quantity: 2,
          skuCode: 'TEE-BLK-M',
        },
      ],
    });
    // Stock actual = 2, antes de la venta era 4 (2 + quantity 2), cruza umbral de 3
    tx.productVariant.findUnique.mockResolvedValue({ stock: 2 });

    await (service as any).processPaymentSuccess(1, 'cs_test_123');

    expect(notificationsQueue.enqueueLowStockNotification).toHaveBeenCalledWith(
      {
        productId: 20,
        productVariantId: 10,
        stock: 2,
      },
    );
  });

  it('should mark failed payment without changing stock or order status', async () => {
    tx.order.findUnique.mockResolvedValue({
      id: 1,
      currentStatus: 'pending',
      user: { id: 7, email: 'client@test.com' },
      items: [],
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

  it('should cancel pending order, restore stock, and free promo when checkout expires', async () => {
    tx.order.findUnique.mockResolvedValue({
      id: 1,
      currentStatus: 'pending',
      user: { id: 7, email: 'client@test.com' },
      items: [{ productVariantId: 10, quantity: 2 }],
    });
    tx.productVariant.update.mockResolvedValue({ stock: 10 });

    await (service as any).processPaymentFailure(
      1,
      'cs_test_123',
      PaymentStatus.cancelled,
      true,
      'Stripe checkout session expired',
    );

    expect(tx.order.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        currentStatus: 'cancelled',
        cancelledAt: expect.any(Date),
      },
    });
    // Stock must be restored
    expect(tx.productVariant.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { stock: { increment: 2 } },
    });
    expect(tx.inventoryMovement.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        productVariantId: 10,
        movementType: 'cancellation',
        quantityChange: 2,
      }),
    });
    // Promo code redemption must be freed
    expect(tx.promoCodeRedemption.deleteMany).toHaveBeenCalledWith({
      where: { orderId: 1 },
    });
  });
});
