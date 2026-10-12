import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { NotificationsQueueService } from '../notifications/notifications-queue.service';
import { LowStockNotificationJobDto } from '../notifications/dto/low-stock-notification-job.dto';
import { LOW_STOCK_THRESHOLD } from '../common/constants/inventory.constants';

// ─── WEBHOOKS: Stripe nos AVISA cuando algo pasa (pago exitoso, fallido, reembolso, etc.) ───
// Flujo: Usuario paga → Stripe procesa → Stripe envía POST a nuestro endpoint → Este servicio lo maneja
// Es como una notificación push: Stripe llama a nuestra API, no nosotros a Stripe
@Injectable()
export class WebhooksService {
  private stripe: Stripe;
  // webhookSecret: clave para verificar que el webhook realmente viene de Stripe (no de un impostor)
  private webhookSecret: string;
  // Logger: para registrar mensajes en la consola del servidor (útil para debugging)
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private notificationsQueue: NotificationsQueueService,
  ) {
    this.stripe = new Stripe(
      this.config.get('STRIPE_SECRET_KEY', 'sk_test_placeholder'),
    );
    // STRIPE_WEBHOOK_SECRET empieza con "whsec_" — se obtiene al crear el webhook en el dashboard de Stripe
    this.webhookSecret = this.config.get(
      'STRIPE_WEBHOOK_SECRET',
      'whsec_placeholder',
    );
  }

  // Método principal: recibe el webhook crudo de Stripe y lo procesa
  // payload: el body crudo (Buffer, NO JSON parseado) — necesario para verificar la firma
  // signature: header "stripe-signature" que Stripe envía para probar autenticidad
  async handleWebhook(payload: Buffer, signature: string) {
    let event: Stripe.Event;

    try {
      // constructEvent: verifica que la firma del webhook sea válida
      // Si alguien intenta enviar un webhook falso, esto lanza un error
      // Por eso necesitamos rawBody: true en main.ts — el body no debe ser parseado antes
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret,
      );
    } catch {
      throw new BadRequestException('Invalid webhook signature');
    }

    // Idempotencia atómica: intenta insertar el evento, si ya existe lo ignora
    // Usa try/catch con unique constraint en vez de findUnique+create separados
    // para evitar race condition cuando dos webhooks idénticos llegan al mismo tiempo
    try {
      await this.prisma.stripeWebhookEvent.create({
        data: {
          stripeEventId: event.id,
          eventType: event.type,
          payload: event.data as any,
        },
      });
    } catch (error: any) {
      // P2002 = unique constraint violation → el evento ya fue registrado
      if (error.code === 'P2002') {
        return { received: true, duplicate: true };
      }
      throw error;
    }

    try {
      // Maneja el evento según su tipo — Stripe envía muchos tipos diferentes
      switch (event.type) {
        // Flujo 1: PaymentIntent exitoso (cuando el frontend confirma el pago con Stripe Elements)
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object);
          break;
        // Flujo 2: Checkout Session completada (cuando el usuario paga via Payment Link)
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object);
          break;
        case 'checkout.session.async_payment_failed':
          await this.handleCheckoutSessionPaymentFailed(event.data.object);
          break;
        case 'checkout.session.expired':
          await this.handleCheckoutSessionExpired(event.data.object);
          break;
      }

      // Marca el evento como procesado exitosamente
      await this.prisma.stripeWebhookEvent.update({
        where: { stripeEventId: event.id },
        data: { processedAt: new Date() },
      });
    } catch (error: any) {
      // Si falla el procesamiento, guarda el error pero NO relanza la excepción
      // Así Stripe recibe un 200 y no reintenta — el error queda registrado para revisión manual
      this.logger.error(`Webhook processing failed: ${error.message}`);
      await this.prisma.stripeWebhookEvent.update({
        where: { stripeEventId: event.id },
        data: { errorMessage: error.message },
      });
    }

    // Siempre responde 200 a Stripe para confirmar que recibimos el webhook
    return { received: true };
  }

  // Maneja el evento de PaymentIntent exitoso — extrae el orderId del metadata
  private async handlePaymentIntentSucceeded(pi: Stripe.PaymentIntent) {
    const orderId = parseInt(pi.metadata.orderId, 10);
    if (!orderId) return;

    await this.processPaymentSuccess(orderId, pi.id);
  }

  private async handlePaymentIntentFailed(pi: Stripe.PaymentIntent) {
    const orderId = parseInt(pi.metadata.orderId, 10);
    if (!orderId) return;

    await this.processPaymentFailure(
      orderId,
      pi.id,
      PaymentStatus.failed,
      false,
      'Stripe payment intent failed',
    );
  }

  // Maneja el evento de Checkout Session completada — mismo flujo, diferente fuente
  private async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
  ) {
    const orderId = parseInt(session.metadata?.orderId ?? '', 10);
    if (!orderId) return;

    await this.processPaymentSuccess(orderId, session.id);
  }

  private async handleCheckoutSessionPaymentFailed(
    session: Stripe.Checkout.Session,
  ) {
    const orderId = parseInt(session.metadata?.orderId ?? '', 10);
    if (!orderId) return;

    await this.processPaymentFailure(
      orderId,
      session.id,
      PaymentStatus.failed,
      false,
      'Stripe checkout payment failed',
    );
  }

  private async handleCheckoutSessionExpired(session: Stripe.Checkout.Session) {
    const orderId = parseInt(session.metadata?.orderId ?? '', 10);
    if (!orderId) return;

    await this.processPaymentFailure(
      orderId,
      session.id,
      PaymentStatus.cancelled,
      true,
      'Stripe checkout session expired',
    );
  }

  // Lógica compartida: actualizar orden, pago, stock e inventario tras un pago exitoso
  private async processPaymentSuccess(
    orderId: number,
    providerPaymentId: string,
  ) {
    const lowStockJobs: LowStockNotificationJobDto[] = [];
    // $transaction: ejecuta todo dentro de una transacción de BD
    // Si cualquier operación falla, TODAS se revierten (atomicidad)
    // Esto evita inconsistencias como: orden marcada como pagada pero stock sin descontar
    await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          user: { select: { id: true, email: true } },
          items: { include: { productVariant: true } },
        },
      });
      // Solo procesa si la orden existe y está en estado "pending"
      if (!order || order.currentStatus !== OrderStatus.pending) return;

      // Cambia el estado de la orden de "pending" a "paid"
      // (el stock ya fue reservado al crear la orden en orders.service.ts)
      await tx.order.update({
        where: { id: orderId },
        data: { currentStatus: OrderStatus.paid },
      });

      // Registra el cambio de estado en el historial (auditoría)
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: OrderStatus.pending,
          toStatus: OrderStatus.paid,
        },
      });

      // Marca el pago como exitoso con la fecha actual
      await tx.payment.updateMany({
        where: { orderId, providerPaymentId },
        data: { status: PaymentStatus.succeeded, paidAt: new Date() },
      });

      await tx.notification.create({
        data: {
          userId: order.user.id,
          type: 'order_paid',
          recipientEmail: order.user.email,
        },
      });

      // Verifica alertas de stock bajo (el stock ya fue decrementado al crear la orden)
      // Notifica siempre que el stock esté bajo el umbral, pero solo si no se envió
      // una notificación para ese SKU en las últimas 24 horas (evita spam)
      for (const item of order.items) {
        const sku = await tx.productVariant.findUnique({
          where: { id: item.productVariantId },
        });
        if (!sku || sku.stock > LOW_STOCK_THRESHOLD) continue;

        const recentNotification = await tx.notification.findFirst({
          where: {
            productVariantId: item.productVariantId,
            type: 'low_stock',
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        });
        if (recentNotification) continue;

        this.logger.log(
          `Low stock alert: SKU ${item.productVariantId} now at ${sku.stock}`,
        );
        lowStockJobs.push({
          productId: item.productVariant.productId,
          productVariantId: item.productVariantId,
          stock: sku.stock,
        });
      }
    });

    await Promise.all(
      lowStockJobs.map((job) =>
        this.notificationsQueue.enqueueLowStockNotification(job),
      ),
    );
  }

  private async processPaymentFailure(
    orderId: number,
    providerPaymentId: string,
    status: PaymentStatus,
    cancelOrder: boolean,
    reason: string,
  ) {
    await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          user: { select: { id: true, email: true } },
          items: true,
        },
      });
      if (!order || order.currentStatus !== OrderStatus.pending) return;

      await tx.payment.updateMany({
        where: { orderId, providerPaymentId },
        data: { status },
      });

      if (!cancelOrder) return;

      await tx.order.update({
        where: { id: orderId },
        data: {
          currentStatus: OrderStatus.cancelled,
          cancelledAt: new Date(),
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: OrderStatus.pending,
          toStatus: OrderStatus.cancelled,
          reason,
        },
      });

      // Restaura stock reservado al crear la orden
      for (const item of order.items) {
        const sku = await tx.productVariant.update({
          where: { id: item.productVariantId },
          data: { stock: { increment: item.quantity } },
        });
        await tx.inventoryMovement.create({
          data: {
            productVariantId: item.productVariantId,
            orderId,
            movementType: 'cancellation',
            quantityChange: item.quantity,
            stockAfter: sku.stock,
          },
        });
      }

      // Libera uso del promo code si existía
      await tx.promoCodeRedemption.deleteMany({
        where: { orderId },
      });

      await tx.notification.create({
        data: {
          userId: order.user.id,
          type: 'order_cancelled',
          recipientEmail: order.user.email,
        },
      });
    });
  }
}
