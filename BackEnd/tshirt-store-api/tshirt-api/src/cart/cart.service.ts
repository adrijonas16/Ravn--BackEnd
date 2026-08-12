import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  // Obtiene el carrito activo del usuario, o crea uno nuevo si no existe
  // Cada usuario solo puede tener UN carrito activo a la vez
  async getOrCreateCart(userId: number) {
    let cart = await this.prisma.cart.findFirst({
      where: { userId, status: 'active' },
      // include anidado: trae items → SKU → producto (con imagen) + talla + color
      include: {
        items: {
          include: {
            productSku: {
              include: {
                product: { include: { images: { where: { isPrimary: true }, take: 1 } } },
                size: true,
                color: true,
              },
            },
          },
        },
      },
    });

    // Si no tiene carrito activo, crea uno vacío
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              productSku: {
                include: {
                  product: { include: { images: { where: { isPrimary: true }, take: 1 } } },
                  size: true,
                  color: true,
                },
              },
            },
          },
        },
      });
    }

    // Transforma los datos de Prisma a un formato limpio para el frontend
    return this.formatCart(cart);
  }

  // Agrega un item al carrito (o incrementa cantidad si ya existe ese SKU)
  async addItem(userId: number, dto: AddCartItemDto) {
    // Valida que el SKU exista, esté activo y el producto no esté eliminado
    const sku = await this.prisma.productSku.findUnique({
      where: { id: dto.productSkuId },
      include: { product: true },
    });
    if (!sku || !sku.isActive || sku.product.deletedAt) {
      throw new NotFoundException('Product SKU not found or inactive');
    }
    // Verifica stock antes de agregar
    if (sku.stock < dto.quantity) {
      throw new BadRequestException(
        `Insufficient stock (available: ${sku.stock})`,
      );
    }

    const cart = await this.ensureActiveCart(userId);

    // Índice compuesto cartId+productSkuId: un SKU solo aparece una vez por carrito
    const existingItem = await this.prisma.cartItem.findUnique({
      where: { cartId_productSkuId: { cartId: cart.id, productSkuId: dto.productSkuId } },
    });

    if (existingItem) {
      // Si ya existe, suma la cantidad (no reemplaza)
      const newQty = existingItem.quantity + dto.quantity;
      if (newQty > sku.stock) {
        throw new BadRequestException(
          `Insufficient stock (available: ${sku.stock}, in cart: ${existingItem.quantity})`,
        );
      }
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQty },
      });
    } else {
      // Si no existe, crea un nuevo item en el carrito
      await this.prisma.cartItem.create({
        data: { cartId: cart.id, productSkuId: dto.productSkuId, quantity: dto.quantity },
      });
    }

    // Retorna el carrito completo actualizado (patrón común en APIs de carrito)
    return this.getOrCreateCart(userId);
  }

  // Actualiza la cantidad de un item (reemplaza, no suma)
  async updateItem(userId: number, itemId: number, dto: UpdateCartItemDto) {
    const cart = await this.ensureActiveCart(userId);
    // Busca el item verificando que pertenezca al carrito del usuario (seguridad)
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
      include: { productSku: true },
    });
    if (!item) throw new NotFoundException('Cart item not found');

    if (dto.quantity > item.productSku.stock) {
      throw new BadRequestException(
        `Insufficient stock (available: ${item.productSku.stock})`,
      );
    }

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity },
    });

    return this.getOrCreateCart(userId);
  }

  // Elimina un item del carrito (aquí sí es hard delete porque es solo un item temporal)
  async removeItem(userId: number, itemId: number) {
    const cart = await this.ensureActiveCart(userId);
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });
    if (!item) throw new NotFoundException('Cart item not found');

    await this.prisma.cartItem.delete({ where: { id: itemId } });
  }

  // Helper privado: garantiza que siempre haya un carrito activo para operar
  private async ensureActiveCart(userId: number) {
    let cart = await this.prisma.cart.findFirst({
      where: { userId, status: 'active' },
    });
    if (!cart) {
      cart = await this.prisma.cart.create({ data: { userId } });
    }
    return cart;
  }

  // Transforma los datos crudos de Prisma al formato que espera el frontend
  // Aplana las relaciones anidadas para que sea más fácil de consumir
  private formatCart(cart: any) {
    const items = cart.items.map((item: any) => ({
      id: item.id,
      productSkuId: item.productSkuId,
      productName: item.productSku.product.name,
      skuCode: item.productSku.sku,
      sizeName: item.productSku.size.name,
      colorName: item.productSku.color.name,
      imageUrl: item.productSku.product.images[0]?.publicUrl ?? null,
      unitPrice: Number(item.productSku.price),
      quantity: item.quantity,
      lineTotal: Number(item.productSku.price) * item.quantity,
    }));

    return {
      id: cart.id,
      items,
      totalAmount: items.reduce((sum: number, i: any) => sum + i.lineTotal, 0),
    };
  }
}
