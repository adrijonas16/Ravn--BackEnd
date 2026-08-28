import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from '@prisma/client';
import type { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { UpdateOrderStatusCommandDto } from './dto/update-order-status-command.dto';
import { CancelOrderCommandDto } from './dto/cancel-order-command.dto';

// Máquina de estados: define qué transiciones de estado son válidas
// Ej: de "paid" solo puede ir a "processing" o "cancelled", nunca a "delivered" directamente
const VALID_TRANSITIONS: Record<string, OrderStatus[]> = {
  pending: [OrderStatus.cancelled],
  paid: [OrderStatus.processing, OrderStatus.cancelled],
  processing: [OrderStatus.shipped, OrderStatus.cancelled],
  shipped: [OrderStatus.delivered],
};

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  // Convierte el carrito activo del usuario en una orden de compra
  async create(userId: number, dto: CreateOrderDto) {
    // Busca el carrito activo con todos sus items y detalles del producto
    const cart = await this.prisma.cart.findFirst({
      where: { userId, status: 'active' },
      include: {
        items: {
          include: {
            productVariant: {
              include: {
                product: {
                  include: { images: { where: { isPrimary: true }, take: 1 } },
                },
                size: true,
                color: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Valida que la dirección pertenezca al usuario (seguridad: no puede usar dirección ajena)
    const address = await this.prisma.address.findFirst({
      where: { id: dto.addressId, userId },
    });
    if (!address) throw new NotFoundException('Address not found');

    // Valida stock disponible para cada item antes de crear la orden
    for (const item of cart.items) {
      if (item.productVariant.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${item.productVariant.sku} (available: ${item.productVariant.stock})`,
        );
      }
    }

    // Calcula subtotal y prepara los items de la orden con datos "congelados"
    // (se copia nombre, precio, etc. para que no cambien si el producto se edita después)
    let subtotal = 0;
    const orderItems = cart.items.map((item) => {
      const lineTotal = Number(item.productVariant.price) * item.quantity;
      subtotal += lineTotal;
      return {
        productVariantId: item.productVariantId,
        productName: item.productVariant.product.name,
        skuCode: item.productVariant.sku,
        sizeName: item.productVariant.size.name,
        colorName: item.productVariant.color.name,
        imageUrl: item.productVariant.product.images[0]?.publicUrl ?? null,
        quantity: item.quantity,
        unitPrice: item.productVariant.price,
        lineTotal,
      };
    });

    let discountAmount = 0;
    let promoCodeId: number | null = null;

    // Lógica de código promocional: valida que esté activo, no expirado, y que
    // el subtotal cumpla el mínimo de compra. También verifica límite de usos.
    if (dto.promoCode) {
      const promo = await this.prisma.promoCode.findUnique({
        where: { code: dto.promoCode },
      });
      if (
        promo &&
        promo.isActive &&
        promo.expiresAt > new Date() &&
        (!promo.minimumPurchaseAmount ||
          subtotal >= Number(promo.minimumPurchaseAmount))
      ) {
        const redemptionCount = await this.prisma.promoCodeRedemption.count({
          where: { promoCodeId: promo.id },
        });
        if (redemptionCount < promo.usageLimit) {
          promoCodeId = promo.id;
          // Descuento porcentual o fijo, nunca mayor al subtotal
          discountAmount =
            promo.discountType === 'percentage'
              ? subtotal * (Number(promo.discountValue) / 100)
              : Number(promo.discountValue);
          discountAmount = Math.min(discountAmount, subtotal);
        }
      }
    }

    const totalAmount = subtotal - discountAmount;
    // Genera número de orden único usando timestamp en base 36 (ej: ORD-K5F3X2Y)
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;

    // Transacción: todas estas operaciones se ejecutan juntas o ninguna
    // Si algo falla, se revierte todo automáticamente (rollback)
    const order = await this.prisma.$transaction(async (tx) => {
      // Crea la orden con sus items y primer registro de historial de estado
      const created = await tx.order.create({
        data: {
          orderNumber,
          userId,
          sourceCartId: cart.id,
          promoCodeId,
          subtotal,
          discountAmount,
          totalAmount,
          recipientName: address.recipientName,
          recipientPhone: address.recipientPhone,
          shippingLine1: address.line1,
          shippingLine2: address.line2,
          shippingCity: address.city,
          shippingStateRegion: address.stateRegion,
          shippingPostalCode: address.postalCode,
          shippingCountryCode: address.countryCode,
          items: { create: orderItems },
          statusHistory: {
            create: { toStatus: OrderStatus.pending },
          },
        },
        include: { items: true, statusHistory: true },
      });

      // Registra la redención del código promo (para controlar límite de usos)
      if (promoCodeId) {
        await tx.promoCodeRedemption.create({
          data: {
            promoCodeId,
            userId,
            orderId: created.id,
            discountAmount,
          },
        });
      }

      // Marca el carrito como "converted" para que no se pueda usar de nuevo
      await tx.cart.update({
        where: { id: cart.id },
        data: { status: 'converted' },
      });

      return created;
    });

    return order;
  }

  async findAll(user: AuthenticatedUser, params: ListOrdersQueryDto) {
    const { page, limit, status, fromDate, toDate, minAmount, maxAmount } =
      params;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Control de acceso por rol:
    // - Cliente solo ve sus propias órdenes
    // - Repartidor solo ve las órdenes que tiene asignadas
    // - Manager ve todas (no se agrega filtro)
    if (user.role === 'client') {
      where.userId = user.id;
    } else if (user.role === 'delivery_person') {
      where.assignedDeliveryUserId = user.id;
    }

    if (status) where.currentStatus = status;
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate);
      if (toDate) where.createdAt.lte = new Date(toDate + 'T23:59:59.999Z');
    }
    if (minAmount !== undefined || maxAmount !== undefined) {
      where.totalAmount = {};
      if (minAmount !== undefined) where.totalAmount.gte = minAmount;
      if (maxAmount !== undefined) where.totalAmount.lte = maxAmount;
    }

    const [data, totalItems] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          deliveryPerson: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          items: true,
          payments: { take: 1 },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: data.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        currentStatus: o.currentStatus,
        subtotal: Number(o.subtotal),
        discountAmount: Number(o.discountAmount),
        totalAmount: Number(o.totalAmount),
        paymentMethod: o.payments[0]?.method ?? null,
        customer: {
          id: o.user.id,
          email: o.user.email,
          firstName: o.user.firstName,
          lastName: o.user.lastName,
          phone: o.user.phone,
        },
        deliveryPerson: o.deliveryPerson
          ? {
              id: o.deliveryPerson.id,
              email: o.deliveryPerson.email,
              firstName: o.deliveryPerson.firstName,
              lastName: o.deliveryPerson.lastName,
              phone: o.deliveryPerson.phone,
            }
          : null,
        shippingAddress: {
          recipientName: o.recipientName,
          recipientPhone: o.recipientPhone,
          line1: o.shippingLine1,
          line2: o.shippingLine2,
          city: o.shippingCity,
          stateRegion: o.shippingStateRegion,
          postalCode: o.shippingPostalCode,
          countryCode: o.shippingCountryCode,
        },
        items: o.items.map((item) => ({
          id: item.id,
          productVariantId: item.productVariantId,
          productName: item.productName,
          skuCode: item.skuCode,
          sizeName: item.sizeName,
          colorName: item.colorName,
          imageUrl: item.imageUrl,
          unitPrice: Number(item.unitPrice),
          quantity: item.quantity,
          lineTotal: Number(item.lineTotal),
        })),
        createdAt: o.createdAt,
      })),
      meta: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  async findOne(orderId: number, user: AuthenticatedUser) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        statusHistory: {
          orderBy: { createdAt: 'asc' },
          include: { changedBy: { select: { email: true } } },
        },
        payments: { take: 1 },
        promoCode: { select: { code: true } },
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    // Seguridad: verifica que el usuario tenga permiso para ver esta orden específica
    if (user.role === 'client' && order.userId !== user.id) {
      throw new ForbiddenException('Not authorized to view this order');
    }
    if (
      user.role === 'delivery_person' &&
      order.assignedDeliveryUserId !== user.id
    ) {
      throw new ForbiddenException('Not assigned to this order');
    }

    return order;
  }

  async updateStatus(command: UpdateOrderStatusCommandDto) {
    const { orderId, status: newStatus, user, reason } = command;
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { id: true, email: true } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');

    // Valida la transición contra la máquina de estados definida arriba
    const allowed = VALID_TRANSITIONS[order.currentStatus];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${order.currentStatus} to ${newStatus}`,
      );
    }

    // Validación por rol: el repartidor solo puede marcar como "delivered"
    if (
      user.role === 'delivery_person' &&
      newStatus !== OrderStatus.delivered
    ) {
      throw new ForbiddenException(
        'Delivery person can only mark orders as delivered',
      );
    }
    if (
      user.role === 'delivery_person' &&
      order.assignedDeliveryUserId !== user.id
    ) {
      throw new ForbiddenException('Not assigned to this order');
    }

    const data: any = { currentStatus: newStatus };
    if (newStatus === OrderStatus.cancelled) {
      data.cancelledAt = new Date();
    }

    // Transacción: actualiza estado + registra historial + (si cancelado) restaura stock
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data,
        include: { items: true, statusHistory: true },
      });

      // Registra quién cambió el estado y cuándo (auditoría)
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: order.currentStatus,
          toStatus: newStatus,
          changedByUserId: user.id,
          reason,
        },
      });

      await tx.notification.create({
        data: {
          userId: order.user.id,
          type: `order_${newStatus}`,
          recipientEmail: order.user.email,
        },
      });

      // Al cancelar: devuelve el stock de cada item y registra el movimiento de inventario
      if (newStatus === OrderStatus.cancelled) {
        for (const item of updated.items) {
          // increment: suma la cantidad de vuelta al stock del SKU
          await tx.productVariant.update({
            where: { id: item.productVariantId },
            data: { stock: { increment: item.quantity } },
          });
          const sku = await tx.productVariant.findUnique({
            where: { id: item.productVariantId },
          });
          // Registra el movimiento para trazabilidad del inventario
          await tx.inventoryMovement.create({
            data: {
              productVariantId: item.productVariantId,
              orderId,
              movementType: 'cancellation',
              quantityChange: item.quantity,
              stockAfter: sku!.stock,
              createdByUserId: user.id,
            },
          });
        }
      }

      return updated;
    });
  }

  // Endpoint específico para cancelar (más restrictivo que updateStatus)
  async cancelOrder(command: CancelOrderCommandDto) {
    const { orderId, user, reason } = command;
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('Order not found');

    // Solo el dueño de la orden puede cancelarla (si es cliente)
    if (user.role === 'client' && order.userId !== user.id) {
      throw new ForbiddenException('Not the order owner');
    }

    // No se puede cancelar si ya fue enviada, entregada o ya está cancelada
    if (['shipped', 'delivered', 'cancelled'].includes(order.currentStatus)) {
      throw new BadRequestException(
        'Order cannot be cancelled (already shipped or delivered)',
      );
    }

    // Reutiliza updateStatus para la lógica de transacción y restauración de stock
    return this.updateStatus({
      orderId,
      status: OrderStatus.cancelled,
      user,
      reason,
    });
  }
}
