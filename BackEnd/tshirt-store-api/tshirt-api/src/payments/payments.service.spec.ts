import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentStatus } from '@prisma/client';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from './payments.service';

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        retrieve: jest.fn(),
      },
    },
    refunds: {
      create: jest.fn(),
    },
  }));
});

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: Record<string, any>;
  let stripeClient: any;

  beforeEach(() => {
    prisma = {
      payment: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };
    const config = {
      get: jest.fn((key: string, fallback?: string) => {
        if (key === 'STRIPE_SECRET_KEY') return 'sk_test_valid';
        return fallback;
      }),
    };

    service = new PaymentsService(
      prisma as PrismaService,
      config as unknown as ConfigService,
    );
    stripeClient = (Stripe as unknown as jest.Mock).mock.results.at(-1)?.value;
  });

  it('refunds a Stripe checkout payment and marks it refunded', async () => {
    prisma.payment.findFirst.mockResolvedValueOnce({
      id: 7,
      orderId: 3,
      method: 'payment_link',
      provider: 'stripe',
      providerPaymentId: 'cs_test_123',
      status: PaymentStatus.succeeded,
    });
    stripeClient.checkout.sessions.retrieve.mockResolvedValue({
      payment_intent: 'pi_test_123',
    });
    stripeClient.refunds.create.mockResolvedValue({ id: 're_test_123' });
    prisma.payment.update.mockResolvedValue({
      id: 7,
      status: PaymentStatus.refunded,
    });

    await service.refundOrderPayment(3);

    expect(stripeClient.checkout.sessions.retrieve).toHaveBeenCalledWith(
      'cs_test_123',
    );
    expect(stripeClient.refunds.create).toHaveBeenCalledWith(
      {
        payment_intent: 'pi_test_123',
        reason: 'requested_by_customer',
      },
      {
        idempotencyKey: 'order-3-payment-7-cancel-refund',
      },
    );
    expect(prisma.payment.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { status: PaymentStatus.refunded },
    });
  });

  it('marks demo payments refunded without calling Stripe', async () => {
    prisma.payment.findFirst.mockResolvedValueOnce({
      id: 8,
      orderId: 4,
      method: 'payment_link',
      provider: 'stripe_demo',
      providerPaymentId: 'demo_checkout_4',
      status: PaymentStatus.succeeded,
    });
    prisma.payment.update.mockResolvedValue({
      id: 8,
      status: PaymentStatus.refunded,
    });

    await service.refundOrderPayment(4);

    expect(stripeClient.refunds.create).not.toHaveBeenCalled();
    expect(prisma.payment.update).toHaveBeenCalledWith({
      where: { id: 8 },
      data: { status: PaymentStatus.refunded },
    });
  });

  it('rejects paid orders without a refundable payment', async () => {
    prisma.payment.findFirst.mockResolvedValueOnce(null);
    prisma.payment.findFirst.mockResolvedValueOnce(null);

    await expect(service.refundOrderPayment(5)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
