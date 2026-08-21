import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { UpdatePromoCodeDto } from './dto/update-promo-code.dto';

@Injectable()
export class PromoCodesService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20) {
    page = Number(page) || 1;
    limit = Number(limit) || 20;
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
