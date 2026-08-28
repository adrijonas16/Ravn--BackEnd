import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListLikedProductsQueryDto } from './dto/list-liked-products-query.dto';

@Injectable()
export class LikesService {
  constructor(private prisma: PrismaService) {}

  async like(userId: number, productId: number) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
    });
    if (!product) throw new NotFoundException('Product not found');

    const existing = await this.prisma.productLike.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (existing) throw new ConflictException('Already liked');

    await this.prisma.productLike.create({ data: { userId, productId } });
  }

  async findLikedProducts(userId: number, params: ListLikedProductsQueryDto) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 12;
    const skip = (page - 1) * limit;
    const where = {
      userId,
      product: { deletedAt: null, status: 'active' as const },
    };

    const [likes, totalItems] = await Promise.all([
      this.prisma.productLike.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            include: {
              category: true,
              images: { orderBy: { sortOrder: 'asc' }, take: 2 },
              variants: {
                where: { isActive: true },
                include: { size: true, color: true },
              },
              _count: { select: { likes: true } },
            },
          },
        },
      }),
      this.prisma.productLike.count({ where }),
    ]);

    return {
      data: likes.map(({ product }) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        status: product.status,
        category: product.category,
        primaryImage:
          product.images.find((image) => image.isPrimary)?.publicUrl ??
          product.images[0]?.publicUrl ??
          null,
        images: product.images,
        variants: product.variants,
        likesCount: product._count.likes,
        isLiked: true,
        createdAt: product.createdAt,
      })),
      meta: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  async unlike(userId: number, productId: number) {
    const existing = await this.prisma.productLike.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (!existing) throw new NotFoundException('Like not found');

    await this.prisma.productLike.delete({
      where: { userId_productId: { userId, productId } },
    });
  }
}
