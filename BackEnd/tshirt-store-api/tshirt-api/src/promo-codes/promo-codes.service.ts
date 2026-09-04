import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { ListPromoCodesQueryDto } from './dto/list-promo-codes-query.dto';
import { PreviewPromoCodeDto } from './dto/preview-promo-code.dto';
import { UpdatePromoCodeDto } from './dto/update-promo-code.dto';

@Injectable()
export class PromoCodesService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: ListPromoCodesQueryDto) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 20;
    const skip = (page - 1) * limit;

    const [data, totalItems] = await Promise.all([
      this.prisma.promoCode.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { redemptions: true } },
        },
      }),
      this.prisma.promoCode.count(),
    ]);

    return {
      data: data.map((promo) => this.formatPromoCode(promo)),
      meta: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  async create(userId: number, dto: CreatePromoCodeDto) {
    const code = dto.code.trim().toUpperCase();
    const existing = await this.prisma.promoCode.findUnique({
      where: { code },
    });
    if (existing) throw new ConflictException('Promo code already exists');

    const promo = await this.prisma.promoCode.create({
      data: {
        code,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        expiresAt: new Date(dto.expiresAt),
        usageLimit: dto.usageLimit,
        minimumPurchaseAmount: dto.minimumPurchaseAmount,
        isActive: dto.isActive ?? true,
        createdByUserId: userId,
      },
      include: {
        _count: { select: { redemptions: true } },
      },
    });

    return this.formatPromoCode(promo);
  }

  async update(promoCodeId: number, dto: UpdatePromoCodeDto) {
    const promo = await this.prisma.promoCode.findUnique({
      where: { id: promoCodeId },
    });
    if (!promo) throw new NotFoundException('Promo code not found');

    const updated = await this.prisma.promoCode.update({
      where: { id: promoCodeId },
      data: {
        isActive: dto.isActive,
        usageLimit: dto.usageLimit,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
      include: {
        _count: { select: { redemptions: true } },
      },
    });

    return this.formatPromoCode(updated);
  }

  async previewForCart(userId: number, dto: PreviewPromoCodeDto) {
    const code = dto.code.trim().toUpperCase();
    if (!code) throw new BadRequestException('Promo code is required');

    const cart = await this.prisma.cart.findFirst({
      where: { userId, status: 'active' },
      include: {
        items: {
          include: {
            productVariant: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const subtotal = cart.items.reduce(
      (sum, item) => sum + Number(item.productVariant.price) * item.quantity,
      0,
    );
    const promo = await this.prisma.promoCode.findUnique({
      where: { code },
    });

    if (!promo) throw new BadRequestException('Promo code not found');
    if (!promo.isActive)
      throw new BadRequestException('Promo code is disabled');
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

    const redemptionCount = await this.prisma.promoCodeRedemption.count({
      where: { promoCodeId: promo.id },
    });
    if (redemptionCount >= promo.usageLimit) {
      throw new BadRequestException('Promo code usage limit reached');
    }

    const rawDiscount =
      promo.discountType === 'percentage'
        ? subtotal * (Number(promo.discountValue) / 100)
        : Number(promo.discountValue);
    const discountAmount = Math.min(rawDiscount, subtotal);

    return {
      code: promo.code,
      discountType: promo.discountType,
      discountValue: Number(promo.discountValue),
      subtotal,
      discountAmount,
      totalAmount: subtotal - discountAmount,
    };
  }

  private formatPromoCode(promo: any) {
    return {
      id: promo.id,
      code: promo.code,
      discountType: promo.discountType,
      discountValue: Number(promo.discountValue),
      expiresAt: promo.expiresAt,
      usageLimit: promo.usageLimit,
      usageCount: promo._count?.redemptions ?? 0,
      minimumPurchaseAmount:
        promo.minimumPurchaseAmount === null
          ? null
          : Number(promo.minimumPurchaseAmount),
      isActive: promo.isActive,
      createdAt: promo.createdAt,
      updatedAt: promo.updatedAt,
    };
  }
}
