import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
// ConfigService: lee variables de entorno (.env) — aquí lo usamos para las claves de Stripe
import { ConfigService } from '@nestjs/config';
// Stripe: SDK oficial de Stripe para procesar pagos con tarjeta de crédito
import Stripe from 'stripe';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LOW_STOCK_THRESHOLD } from '../common/constants/inventory.constants';

@Injectable()
export class PaymentsService {
  // Cliente de Stripe — se usa para crear pagos, sesiones de checkout, etc.
  private stripe: Stripe;
  private stripeSecretKey: string;

  // Inyección de dependencias: NestJS automáticamente pasa PrismaService y ConfigService
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    // Inicializa el cliente de Stripe con la clave secreta del .env
    // STRIPE_SECRET_KEY empieza con "sk_test_" en desarrollo y "sk_live_" en producción
    this.stripeSecretKey = this.config.get(
      'STRIPE_SECRET_KEY',
      'sk_test_placeholder',
    );
    this.stripe = new Stripe(this.stripeSecretKey);
  }

  private isStripeConfigured() {
    return (
      (this.stripeSecretKey.startsWith('sk_test_') ||
        this.stripeSecretKey.startsWith('sk_live_')) &&
      !this.stripeSecretKey.includes('placeholder')
    );
  }

  // ─── FLUJO 1: Payment Intent (el frontend maneja el formulario de pago) ───
  // El frontend usa Stripe Elements para mostrar el formulario de tarjeta
  async createPaymentIntent(orderId: number, userId: number) {
    // Busca la orden en la base de datos
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    // Validaciones: la orden debe existir, pertenecer al usuario, y estar pendiente
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId)
      throw new ForbiddenException('Not the order owner');
    if (order.currentStatus !== 'pending')
      throw new BadRequestException('Order is not in pending status');
    if (!this.isStripeConfigured()) {
      throw new BadRequestException('Stripe is not configured');
    }

    // Stripe trabaja en centavos: $19.99 → 1999 centavos
    const amount = Math.round(Number(order.totalAmount) * 100);

    // Crea el PaymentIntent en Stripe — esto reserva el cobro pero NO cobra todavía
    // metadata: datos extra que Stripe nos devuelve en el webhook para identificar la orden
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount,
      currency: order.currency.toLowerCase(),
      metadata: { orderId: order.id.toString() },
    });

    // Guarda el registro del pago en nuestra BD (aún sin cobrar)
    await this.prisma.payment.create({
      data: {
        orderId: order.id,
        method: 'payment_intent',
        provider: 'stripe',
        providerPaymentId: paymentIntent.id,
        currency: order.currency,
        amount: order.totalAmount,
      },
    });

    // clientSecret: el frontend lo necesita para confirmar el pago con Stripe Elements
    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: Number(order.totalAmount),
      currency: order.currency,
    };
  }

  async createOrderPaymentLink(orderId: number, userId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId)
      throw new ForbiddenException('Not the order owner');
    if (order.currentStatus !== OrderStatus.pending)
      throw new BadRequestException('Order is not in pending status');

    const existingPayment = await this.prisma.payment.findFirst({
      where: {
        orderId,
        method: 'payment_link',
        status: 'pending',
        providerPaymentLinkId: { not: null },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingPayment?.providerPaymentLinkId) {
      return {
        paymentLinkUrl: existingPayment.providerPaymentLinkId,
        orderId: order.id,
      };
    }

    const successUrl = this.config.get(
      'STRIPE_SUCCESS_URL',
      'http://localhost:5173/orders',
    );
    const cancelUrl = this.config.get(
      'STRIPE_CANCEL_URL',
      'http://localhost:5173/orders',
    );

    if (!this.isStripeConfigured()) {
      const providerPaymentId = `demo_checkout_${order.id}_${Date.now()}`;
      const paymentLinkUrl = `${successUrl}?orderId=${order.id}&demoCheckout=true`;

      await this.prisma.payment.create({
        data: {
          orderId: order.id,
          method: 'payment_link',
          provider: 'stripe_demo',
          providerPaymentId,
          providerPaymentLinkId: paymentLinkUrl,
          currency: order.currency,
          amount: order.totalAmount,
        },
      });

      await this.completeOrderPayment(order.id, providerPaymentId);

      return { paymentLinkUrl, orderId: order.id, demo: true };
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: order.items.map((item) => ({
        price_data: {
          currency: order.currency.toLowerCase(),
          product_data: {
            name: `${item.productName} (${item.sizeName}/${item.colorName})`,
          },
          unit_amount: Math.round(Number(item.unitPrice) * 100),
        },
        quantity: item.quantity,
      })),
      metadata: { orderId: order.id.toString() },
      success_url: `${successUrl}?orderId=${order.id}&checkout=success`,
      cancel_url: `${cancelUrl}?orderId=${order.id}&checkout=cancelled`,
    });

    if (!session.url) {
      throw new BadRequestException('Stripe did not return a checkout URL');
    }

    await this.prisma.payment.create({
      data: {
        orderId: order.id,
        method: 'payment_link',
        provider: 'stripe',
        providerPaymentId: session.id,
        providerPaymentLinkId: session.url,
        currency: order.currency,
        amount: order.totalAmount,
      },
    });

    return { paymentLinkUrl: session.url, orderId: order.id };
  }

  // ─── FLUJO 2: Payment Link (Stripe Checkout — redirige al usuario a una página de Stripe) ───
  // Más simple: Stripe muestra su propia página de pago, no necesitas formulario propio
  async createPaymentLink(
    userId: number,
    productVariantId: number,
    quantity: number,
    addressId: number,
  ) {
    // Busca el SKU (variante específica: talla + color) con su producto, imágenes, talla y color
    const sku = await this.prisma.productVariant.findUnique({
      where: { id: productVariantId },
      include: {
        product: {
          include: { images: { where: { isPrimary: true }, take: 1 } },
        },
        size: true,
        color: true,
      },
    });
    // Valida que el SKU exista, esté activo, y haya suficiente stock
    if (!sku || !sku.isActive) throw new NotFoundException('SKU not found');
    if (sku.stock < quantity)
      throw new BadRequestException('Insufficient stock');

    // Verifica que la dirección de envío exista y pertenezca al usuario
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!address) throw new NotFoundException('Address not found');
    if (!this.isStripeConfigured()) {
      throw new BadRequestException('Stripe is not configured');
    }

    const unitPrice = Number(sku.price);
    const totalAmount = unitPrice * quantity;
    // Genera un número de orden único usando timestamp en base36 (ej: "ORD-LK5F2M")
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;

    // Crea la orden en la BD con sus items y el historial de estado inicial ("pending")
    // "items: { create: {...} }" — crea el item relacionado en la misma operación (nested create)
    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        userId,
        subtotal: totalAmount,
        totalAmount,
        recipientName: address.recipientName,
        recipientPhone: address.recipientPhone,
        shippingLine1: address.line1,
        shippingLine2: address.line2,
        shippingCity: address.city,
        shippingStateRegion: address.stateRegion,
        shippingPostalCode: address.postalCode,
        shippingCountryCode: address.countryCode,
        items: {
          create: {
            productVariantId,
            productName: sku.product.name,
            skuCode: sku.sku,
            sizeName: sku.size.name,
            colorName: sku.color.name,
            imageUrl: sku.product.images[0]?.publicUrl ?? null,
            quantity,
            unitPrice: sku.price,
            lineTotal: totalAmount,
          },
        },
        statusHistory: { create: { toStatus: 'pending' } },
      },
    });

    // Crea una sesión de Stripe Checkout — genera una URL de pago hospedada por Stripe
    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      // line_items: los productos que aparecen en la página de checkout de Stripe
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${sku.product.name} (${sku.size.name}/${sku.color.name})`,
            },
            // unit_amount en centavos (Stripe siempre trabaja en la unidad más pequeña)
            unit_amount: Math.round(unitPrice * 100),
          },
          quantity,
        },
      ],
      // metadata: Stripe nos devuelve estos datos en el webhook para saber qué orden se pagó
      metadata: { orderId: order.id.toString() },
      // URLs a donde Stripe redirige al usuario después de pagar o cancelar
      success_url: this.config.get(
        'STRIPE_SUCCESS_URL',
        'http://localhost:3000/success',
      ),
      cancel_url: this.config.get(
        'STRIPE_CANCEL_URL',
        'http://localhost:3000/cancel',
      ),
    });

    // Guarda el registro del pago con la URL del link de pago
    await this.prisma.payment.create({
      data: {
        orderId: order.id,
        method: 'payment_link',
        provider: 'stripe',
        providerPaymentId: session.id,
        providerPaymentLinkId: session.url,
        currency: 'USD',
        amount: totalAmount,
      },
    });

    // Retorna la URL de Stripe Checkout para que el frontend redirija al usuario
    return { paymentLinkUrl: session.url, orderId: order.id };
  }

  async refundOrderPayment(orderId: number) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        orderId,
        status: PaymentStatus.succeeded,
      },
      orderBy: { paidAt: 'desc' },
    });

    if (!payment) {
      const refundedPayment = await this.prisma.payment.findFirst({
        where: { orderId, status: PaymentStatus.refunded },
        orderBy: { updatedAt: 'desc' },
      });
      if (refundedPayment) return refundedPayment;
      throw new BadRequestException('No refundable payment found for order');
    }

    if (payment.provider === 'stripe_demo') {
      return this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.refunded },
      });
    }

    if (!this.isStripeConfigured()) {
      throw new BadRequestException('Stripe is not configured');
    }
    if (!payment.providerPaymentId) {
      throw new BadRequestException('Payment provider id is missing');
    }

    const paymentIntentId = await this.resolvePaymentIntentId(payment);
    await this.stripe.refunds.create(
      {
        payment_intent: paymentIntentId,
        reason: 'requested_by_customer',
      },
      {
        idempotencyKey: `order-${orderId}-payment-${payment.id}-cancel-refund`,
      },
    );

    return this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.refunded },
    });
  }

  private async resolvePaymentIntentId(payment: {
    method: string;
    providerPaymentId: string | null;
  }) {
    if (!payment.providerPaymentId) {
      throw new BadRequestException('Payment provider id is missing');
    }
    if (payment.method === 'payment_intent') return payment.providerPaymentId;

    const session = await this.stripe.checkout.sessions.retrieve(
      payment.providerPaymentId,
    );
    const paymentIntent = session.payment_intent;
    if (typeof paymentIntent === 'string') return paymentIntent;
    if (paymentIntent?.id) return paymentIntent.id;

    throw new BadRequestException('Stripe payment intent not found for order');
  }

  private async completeOrderPayment(
    orderId: number,
    providerPaymentId: string,
  ) {
    await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: { include: { productVariant: true } },
          user: { select: { id: true, email: true } },
        },
      });
      if (!order || order.currentStatus !== OrderStatus.pending) return;

      await tx.order.update({
        where: { id: orderId },
        data: { currentStatus: OrderStatus.paid },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: OrderStatus.pending,
          toStatus: OrderStatus.paid,
        },
      });

      await tx.payment.updateMany({
        where: { orderId, providerPaymentId },
        data: { status: 'succeeded', paidAt: new Date() },
      });

      await tx.notification.create({
        data: {
          userId: order.user.id,
          type: 'order_paid',
          recipientEmail: order.user.email,
        },
      });

      const managers = await tx.user.findMany({
        where: { role: { name: 'manager' }, status: 'active' },
        select: { id: true, email: true },
      });

      for (const item of order.items) {
        const sku = await tx.productVariant.update({
          where: { id: item.productVariantId },
          data: { stock: { decrement: item.quantity } },
        });

        await tx.inventoryMovement.create({
          data: {
            productVariantId: item.productVariantId,
            orderId,
            movementType: 'sale',
            quantityChange: -item.quantity,
            stockAfter: sku.stock,
          },
        });

        if (
          sku.stock <= LOW_STOCK_THRESHOLD &&
          sku.stock + item.quantity > LOW_STOCK_THRESHOLD &&
          managers.length > 0
        ) {
          await tx.notification.createMany({
            data: managers.map((manager) => ({
              userId: manager.id,
              productId: item.productVariant.productId,
              productVariantId: item.productVariantId,
              type: 'low_stock',
              recipientEmail: manager.email,
            })),
          });
        }
      }
    });
  }
}
