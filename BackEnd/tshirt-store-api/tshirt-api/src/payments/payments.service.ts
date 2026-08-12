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
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  // Cliente de Stripe — se usa para crear pagos, sesiones de checkout, etc.
  private stripe: Stripe;

  // Inyección de dependencias: NestJS automáticamente pasa PrismaService y ConfigService
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    // Inicializa el cliente de Stripe con la clave secreta del .env
    // STRIPE_SECRET_KEY empieza con "sk_test_" en desarrollo y "sk_live_" en producción
    this.stripe = new Stripe(
      this.config.get('STRIPE_SECRET_KEY', 'sk_test_placeholder'),
      { apiVersion: '2025-05-28' as any },
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

  // ─── FLUJO 2: Payment Link (Stripe Checkout — redirige al usuario a una página de Stripe) ───
  // Más simple: Stripe muestra su propia página de pago, no necesitas formulario propio
  async createPaymentLink(
    userId: number,
    productSkuId: number,
    quantity: number,
    addressId: number,
  ) {
    // Busca el SKU (variante específica: talla + color) con su producto, imágenes, talla y color
    const sku = await this.prisma.productSku.findUnique({
      where: { id: productSkuId },
      include: {
        product: { include: { images: { where: { isPrimary: true }, take: 1 } } },
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
            productSkuId,
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
}
