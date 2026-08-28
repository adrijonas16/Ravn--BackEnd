import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductVariantDto } from './dto/create-sku.dto';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { UpdateProductVariantCommandDto } from './dto/update-product-variant-command.dto';
import { CreateProductImageDto } from './dto/create-product-image.dto';
import { UpdateProductImageCommandDto } from './dto/update-product-image-command.dto';

// @Injectable() marca esta clase para que NestJS pueda inyectarla en otros archivos
@Injectable()
export class ProductsService {
  // Inyección de dependencias: Prisma se inyecta automáticamente para acceder a la DB
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    // Verifica que la categoría exista antes de crear el producto
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) throw new NotFoundException('Category not found');

    // Genera un slug URL-friendly a partir del nombre (ej: "Camiseta Azul" → "camiseta-azul-k5f3")
    const slug = this.generateSlug(dto.name);

    // include: trae las relaciones asociadas (categoría, imágenes, variantes) en la misma consulta
    return this.prisma.product.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        categoryId: dto.categoryId,
      },
      include: {
        category: true,
        images: true,
        variants: { include: { size: true, color: true } },
      },
    });
  }

  // Listado con paginación y filtros opcionales (categoría, búsqueda por nombre)
  async findAll(params: ListProductsQueryDto) {
    // Forzamos a número porque los query params llegan como string
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 20;
    const categoryId = params.categoryId
      ? Number(params.categoryId)
      : undefined;
    const search = params.search;
    // skip calcula cuántos registros saltar para la página actual
    const skip = (page - 1) * limit;

    // Solo muestra productos activos y no eliminados (soft delete)
    const where: any = {
      deletedAt: null,
      status: 'active',
    };
    if (categoryId) where.categoryId = categoryId;
    // Búsqueda insensible a mayúsculas/minúsculas (ej: "azul" encuentra "Azul")
    if (search) where.name = { contains: search, mode: 'insensitive' };

    // Promise.all ejecuta ambas consultas en paralelo para mayor velocidad
    const [data, totalItems] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          images: { orderBy: { sortOrder: 'asc' }, take: 2 },
          variants: {
            where: { isActive: true },
            include: { size: true, color: true },
          },
          // _count cuenta las relaciones sin traer todos los datos
          _count: { select: { likes: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    // Transforma los datos de Prisma al formato que espera el cliente (API response)
    return {
      data: data.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        status: p.status,
        category: p.category,
        primaryImage:
          p.images.find((image) => image.isPrimary)?.publicUrl ??
          p.images[0]?.publicUrl ??
          null,
        images: p.images,
        variants: p.variants,
        likesCount: p._count.likes,
        createdAt: p.createdAt,
      })),
      meta: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  // Busca un producto por ID, excluyendo los eliminados con soft delete
  async findOne(id: number) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { include: { size: true, color: true } },
        _count: { select: { likes: true } },
      },
    });

    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(id: number, dto: UpdateProductDto) {
    // Primero verifica que el producto existe (lanza 404 si no)
    await this.findOne(id);
    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) throw new NotFoundException('Category not found');
    }

    const data: any = { ...dto };
    // Si cambió el nombre, regenera el slug para mantener URLs consistentes
    if (dto.name) data.slug = this.generateSlug(dto.name);

    return this.prisma.product.update({
      where: { id },
      data,
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { include: { size: true, color: true } },
      },
    });
  }

  // Soft delete: no borra de la DB, solo marca fecha de eliminación y desactiva
  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'disabled' },
    });
  }

  // ─── Product variants ──────────────────────────────────────────

  // SKU = variante de producto (ej: Camiseta talla M color Rojo, con su precio y stock)
  async createVariant(productId: number, dto: CreateProductVariantDto) {
    await this.findOne(productId);

    // Índice compuesto: verifica que no exista ya una variante con la misma talla+color
    const existing = await this.prisma.productVariant.findUnique({
      where: {
        productId_sizeId_colorId: {
          productId,
          sizeId: dto.sizeId,
          colorId: dto.colorId,
        },
      },
    });
    // ConflictException = HTTP 409 (conflicto con datos existentes)
    if (existing) {
      throw new ConflictException(
        'Product variant with this size and color already exists',
      );
    }

    return this.prisma.productVariant.create({
      data: { ...dto, productId },
      include: { size: true, color: true },
    });
  }

  async findVariants(productId: number) {
    await this.findOne(productId);
    return this.prisma.productVariant.findMany({
      where: { productId },
      include: { size: true, color: true },
    });
  }

  async listSizes() {
    return this.prisma.size.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async listColors() {
    return this.prisma.color.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async updateVariant(command: UpdateProductVariantCommandDto) {
    const { productId, productVariantId, dto } = command;
    const productVariant = await this.prisma.productVariant.findFirst({
      where: { id: productVariantId, productId },
    });
    if (!productVariant)
      throw new NotFoundException('Product variant not found');

    return this.prisma.productVariant.update({
      where: { id: productVariantId },
      data: dto,
      include: { size: true, color: true },
    });
  }

  async addImage(productId: number, dto: CreateProductImageDto) {
    await this.findOne(productId);

    return this.prisma.$transaction(async (tx) => {
      if (dto.isPrimary) {
        await tx.productImage.updateMany({
          where: { productId, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      return tx.productImage.create({
        data: {
          productId,
          publicUrl: dto.publicUrl,
          storageKey: dto.storageKey ?? `external/${productId}/${Date.now()}`,
          altText: dto.altText,
          sortOrder: dto.sortOrder ?? 0,
          isPrimary: dto.isPrimary ?? false,
        },
      });
    });
  }

  async updateImage(command: UpdateProductImageCommandDto) {
    const { productId, imageId, dto } = command;
    await this.ensureProductImage(productId, imageId);

    return this.prisma.$transaction(async (tx) => {
      if (dto.isPrimary) {
        await tx.productImage.updateMany({
          where: { productId, isPrimary: true, NOT: { id: imageId } },
          data: { isPrimary: false },
        });
      }

      return tx.productImage.update({
        where: { id: imageId },
        data: dto,
      });
    });
  }

  async removeImage(productId: number, imageId: number) {
    await this.ensureProductImage(productId, imageId);
    await this.prisma.productImage.delete({ where: { id: imageId } });
  }

  private async ensureProductImage(productId: number, imageId: number) {
    const image = await this.prisma.productImage.findFirst({
      where: { id: imageId, productId },
    });
    if (!image) throw new NotFoundException('Product image not found');
    return image;
  }

  // Genera un slug único: "Camiseta Azul" → "camiseta-azul-k5f3x2"
  // El sufijo con timestamp base-36 evita colisiones de nombres duplicados
  private generateSlug(name: string): string {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const suffix = Date.now().toString(36);
    return `${base}-${suffix}`;
  }
}
