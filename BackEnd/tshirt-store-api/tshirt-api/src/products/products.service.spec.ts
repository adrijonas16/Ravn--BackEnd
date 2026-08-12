import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: Record<string, any>;

  beforeEach(async () => {
    prisma = {
      product: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      category: { findUnique: jest.fn() },
      productSku: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(ProductsService);
  });

  describe('create', () => {
    const dto = {
      name: 'Cool Tee',
      description: 'A cool t-shirt',
      categoryId: 1,
    };

    it('should create a product with a generated slug', async () => {
      prisma.category.findUnique.mockResolvedValue({ id: 1, name: 'Basics' });
      prisma.product.create.mockResolvedValue({
        id: 1,
        ...dto,
        slug: 'cool-tee-abc',
        status: 'active',
      });

      const result = await service.create(dto);

      expect(result.id).toBe(1);
      expect(prisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: dto.name,
            description: dto.description,
            categoryId: dto.categoryId,
          }),
        }),
      );
    });

    it('should throw NotFoundException for non-existent category', async () => {
      prisma.category.findUnique.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      const mockProducts = [
        {
          id: 1,
          name: 'Tee 1',
          slug: 'tee-1',
          description: 'desc',
          status: 'active',
          category: { id: 1, name: 'Basics' },
          images: [{ publicUrl: 'http://img.jpg' }],
          _count: { likes: 5 },
          createdAt: new Date(),
        },
      ];
      prisma.product.findMany.mockResolvedValue(mockProducts);
      prisma.product.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.totalItems).toBe(1);
      expect(result.meta.page).toBe(1);
    });

    it('should filter by categoryId', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 20, categoryId: 5 });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ categoryId: 5 }),
        }),
      );
    });

    it('should filter by search term', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 20, search: 'sunset' });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { contains: 'sunset', mode: 'insensitive' },
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      prisma.product.findFirst.mockResolvedValue({
        id: 1,
        name: 'Tee',
        deletedAt: null,
      });

      const result = await service.findOne(1);
      expect(result.id).toBe(1);
    });

    it('should throw NotFoundException for non-existent product', async () => {
      prisma.product.findFirst.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      prisma.product.findFirst.mockResolvedValue({ id: 1 });
      prisma.product.update.mockResolvedValue({
        id: 1,
        name: 'Updated Tee',
        status: 'active',
      });

      const result = await service.update(1, { name: 'Updated Tee' });
      expect(result.name).toBe('Updated Tee');
    });

    it('should throw NotFoundException if product does not exist', async () => {
      prisma.product.findFirst.mockResolvedValue(null);

      await expect(
        service.update(999, { name: 'Nope' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft-delete a product', async () => {
      prisma.product.findFirst.mockResolvedValue({ id: 1 });
      prisma.product.update.mockResolvedValue({});

      await service.remove(1);

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          status: 'disabled',
        }),
      });
    });
  });

  describe('createSku', () => {
    const dto = {
      sizeId: 1,
      colorId: 1,
      sku: 'TEE-BLU-M',
      price: 29.99,
      stock: 50,
    };

    it('should create a SKU for a product', async () => {
      prisma.product.findFirst.mockResolvedValue({ id: 1 });
      prisma.productSku.findUnique.mockResolvedValue(null);
      prisma.productSku.create.mockResolvedValue({
        id: 1,
        ...dto,
        productId: 1,
        size: { name: 'M' },
        color: { name: 'Blue' },
      });

      const result = await service.createSku(1, dto);

      expect(result.sku).toBe('TEE-BLU-M');
      expect(result.size.name).toBe('M');
    });

    it('should throw ConflictException for duplicate size+color', async () => {
      prisma.product.findFirst.mockResolvedValue({ id: 1 });
      prisma.productSku.findUnique.mockResolvedValue({ id: 1 });

      await expect(service.createSku(1, dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('updateSku', () => {
    it('should update a SKU', async () => {
      prisma.productSku.findFirst.mockResolvedValue({ id: 1, productId: 1 });
      prisma.productSku.update.mockResolvedValue({
        id: 1,
        price: 34.99,
        size: { name: 'M' },
        color: { name: 'Blue' },
      });

      const result = await service.updateSku(1, 1, { price: 34.99 });
      expect(result.price).toBe(34.99);
    });

    it('should throw NotFoundException if SKU does not exist', async () => {
      prisma.productSku.findFirst.mockResolvedValue(null);

      await expect(
        service.updateSku(1, 999, { price: 10 }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
