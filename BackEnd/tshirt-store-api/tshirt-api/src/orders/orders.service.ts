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
import { PaymentsService } from '../payments/payments.service';
import { MAX_ACTIVE_DELIVERIES } from '../common/constants/delivery.constants';

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
  constructor(
    private prisma: PrismaService,
    private paymentsService: PaymentsService,
  ) {}

  // Convierte el carrito activo del usuario en una orden de compra
  async create(userId: number, dto: CreateOrderDto) {
    // Valida que la dirección pertenezca al usuario antes de la transacción
    // (lectura que no necesita lock, solo verifica ownership)
    const address = await this.prisma.address.findFirst({
      where: { id: dto.addressId, userId },
    });
    if (!address) throw new NotFoundException('Address not found');

    // Genera número de orden único usando timestamp en base 36 (ej: ORD-K5F3X2Y)
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;

    // Transacción con lock explícito para controlar concurrencia:
    // 1. $transaction garantiza atomicidad (todo o nada)
    // 2. SELECT FOR UPDATE garantiza que solo un request procese el carrito a la vez
    //    — el segundo request espera a que el primero termine, luego lee 'converted'
    const order = await this.prisma.$transaction(async (tx) => {
      // Lock exclusivo en la fila del carrito: si otro request intenta leer el mismo
      // carrito, se bloquea aquí hasta que esta transacción termine (commit o rollback)
      const lockedCarts = await tx.$queryRaw<{ id: number }[]>`
        SELECT id FROM "tshirt_store"."carts"
        WHERE "user_id" = ${userId} AND "status" = 'active'
        LIMIT 1
        FOR UPDATE
      `;

      if (lockedCarts.length === 0) {
        throw new BadRequestException('Cart is empty');
      }

      // Ahora que tenemos el lock, leemos el carrito completo con sus relaciones
      const cart = await tx.cart.findFirst({
        where: { id: lockedCarts[0].id },
        include: {
          items: {
            include: {
              productVariant: {
                include: {
                  product: {
                    include: {
                      images: { where: { isPrimary: true }, take: 1 },
                    },
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

      // Valida stock disponible para cada item dentro de la transacción
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

      // Lógica de código promocional dentro de la transacción
      if (dto.promoCode) {
        const code = dto.promoCode.trim().toUpperCase();
        const promo = await tx.promoCode.findUnique({
          where: { code },
        });
        if (!promo) throw new BadRequestException('Promo code not found');
        if (!promo.isActive) {
          throw new BadRequestException('Promo code is disabled');
        }
        if (promo.expiresAt <= new Date()) {
          throw new BadRequestException('Promo code has expired');
        }
        if (
          promo.minimumPurchaseAmount &&
          subtotal < Number(promo.minimumPurchaseAmount)
        ) {
          throw new BadRequestException(
            `Minimum purchase amount is $${Number(promo.minimumPurchaseAmount).toFixed(2)}`,
          );
        }

        const redemptionCount = await tx.promoCodeRedemption.count({
          where: { promoCodeId: promo.id },
        });
        if (redemptionCount >= promo.usageLimit) {
          throw new BadRequestException('Promo code usage limit reached');
        }

        // Verifica que este usuario no haya usado ya este promo code
        const userRedemption = await tx.promoCodeRedemption.findFirst({
          where: { promoCodeId: promo.id, userId },
        });
        if (userRedemption) {
          throw new BadRequestException(
            'You have already used this promo code',
          );
        }

        promoCodeId = promo.id;
        // Descuento porcentual o fijo, nunca mayor al subtotal
        discountAmount =
          promo.discountType === 'percentage'
            ? subtotal * (Number(promo.discountValue) / 100)
            : Number(promo.discountValue);
        discountAmount = Math.min(discountAmount, subtotal);
      }

      const totalAmount = subtotal - discountAmount;

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

      // Reserva de stock: decrementa al crear la orden para evitar overselling
      // Si el pago falla o la orden se cancela, el stock se restaura
      for (const item of cart.items) {
        const sku = await tx.productVariant.update({
          where: { id: item.productVariantId },
          data: { stock: { decrement: item.quantity } },
        });
        await tx.inventoryMovement.create({
          data: {
            productVariantId: item.productVariantId,
            orderId: created.id,
            movementType: 'sale',
            quantityChange: -item.quantity,
            stockAfter: sku.stock,
          },
        });
      }

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

      // Limpia los items del carrito y marca como "converted"
      // Los items ya están copiados en la orden, no se necesitan más
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
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

    // Formato consistente con findAll
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      currentStatus: order.currentStatus,
      subtotal: Number(order.subtotal),
      discountAmount: Number(order.discountAmount),
      totalAmount: Number(order.totalAmount),
      paymentMethod: order.payments[0]?.method ?? null,
      promoCode: order.promoCode?.code ?? null,
      customer: {
        id: order.user.id,
        email: order.user.email,
        firstName: order.user.firstName,
        lastName: order.user.lastName,
        phone: order.user.phone,
      },
      deliveryPerson: order.deliveryPerson
        ? {
            id: order.deliveryPerson.id,
            email: order.deliveryPerson.email,
            firstName: order.deliveryPerson.firstName,
            lastName: order.deliveryPerson.lastName,
            phone: order.deliveryPerson.phone,
          }
        : null,
      shippingAddress: {
        recipientName: order.recipientName,
        recipientPhone: order.recipientPhone,
        line1: order.shippingLine1,
        line2: order.shippingLine2,
        city: order.shippingCity,
        stateRegion: order.shippingStateRegion,
        postalCode: order.shippingPostalCode,
        countryCode: order.shippingCountryCode,
      },
      items: order.items.map((item) => ({
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
      statusHistory: order.statusHistory,
      createdAt: order.createdAt,
    };
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
      if (
        order.currentStatus === OrderStatus.paid ||
        order.currentStatus === OrderStatus.processing
      ) {
        await this.paymentsService.refundOrderPayment(orderId);
      }
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

        // Libera el uso del promo code para que pueda usarse de nuevo
        await tx.promoCodeRedemption.deleteMany({
          where: { orderId },
        });
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

  // Lista todos los repartidores con su carga de trabajo actual (solo managers)
  async getDeliveryWorkload() {
    // Trae todos los delivery_person activos con el conteo de órdenes activas
    const deliveryPersons = await this.prisma.user.findMany({
      where: {
        role: { name: 'delivery_person' },
        status: 'active',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        // Cuenta órdenes en tránsito (asignadas pero no entregadas ni canceladas)
        assignedDeliveries: {
          where: {
            currentStatus: {
              in: [
                OrderStatus.paid,
                OrderStatus.processing,
                OrderStatus.shipped,
              ],
            },
          },
          select: {
            id: true,
            orderNumber: true,
            currentStatus: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            assignedDeliveries: {
              where: {
                currentStatus: OrderStatus.delivered,
                updatedAt: {
                  // Entregas de hoy (para ver cuántas hizo en el día)
                  gte: new Date(new Date().setHours(0, 0, 0, 0)),
                },
              },
            },
          },
        },
      },
      orderBy: { firstName: 'asc' },
    });

    return deliveryPersons.map((dp) => ({
      id: dp.id,
      email: dp.email,
      firstName: dp.firstName,
      lastName: dp.lastName,
      phone: dp.phone,
      activeOrders: dp.assignedDeliveries.length,
      activeOrdersList: dp.assignedDeliveries,
      deliveredToday: dp._count.assignedDeliveries,
      maxActiveDeliveries: MAX_ACTIVE_DELIVERIES,
      available: dp.assignedDeliveries.length < MAX_ACTIVE_DELIVERIES,
    }));
  }

  // Asigna un repartidor a una orden (solo managers)
  async assignDelivery(orderId: number, deliveryUserId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('Order not found');

    // Solo se puede asignar repartidor a órdenes pagadas o en processing
    if (
      order.currentStatus !== OrderStatus.paid &&
      order.currentStatus !== OrderStatus.processing
    ) {
      throw new BadRequestException(
        `Cannot assign delivery to an order in "${order.currentStatus}" status`,
      );
    }

    // Valida que el usuario asignado exista y sea delivery_person
    const deliveryUser = await this.prisma.user.findUnique({
      where: { id: deliveryUserId },
      include: { role: true },
    });
    if (!deliveryUser || deliveryUser.role.name !== 'delivery_person') {
      throw new BadRequestException('User is not a delivery person');
    }
    if (deliveryUser.status !== 'active') {
      throw new BadRequestException('Delivery person account is not active');
    }

    // Verifica que el repartidor no esté al máximo de capacidad
    const activeCount = await this.prisma.order.count({
      where: {
        assignedDeliveryUserId: deliveryUserId,
        currentStatus: {
          in: [OrderStatus.paid, OrderStatus.processing, OrderStatus.shipped],
        },
      },
    });
    if (activeCount >= MAX_ACTIVE_DELIVERIES) {
      throw new BadRequestException(
        `Delivery person has reached the maximum of ${MAX_ACTIVE_DELIVERIES} active orders`,
      );
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { assignedDeliveryUserId: deliveryUserId },
      include: {
        deliveryPerson: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });
  }
}
