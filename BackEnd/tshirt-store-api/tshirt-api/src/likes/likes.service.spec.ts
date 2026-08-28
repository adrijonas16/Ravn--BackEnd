import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { LikesService } from './likes.service';
import { PrismaService } from '../prisma/prisma.service';

describe('LikesService', () => {
  let service: LikesService;
  let prisma: Record<string, any>;

  beforeEach(async () => {
    prisma = {
      product: { findFirst: jest.fn() },
      productLike: {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [LikesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(LikesService);
  });

  describe('like', () => {
    it('should throw NotFoundException for non-existent product', async () => {
      prisma.product.findFirst.mockResolvedValue(null);
      await expect(service.like(1, 999)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if already liked', async () => {
      prisma.product.findFirst.mockResolvedValue({ id: 1 });
      prisma.productLike.findUnique.mockResolvedValue({
        userId: 1,
        productId: 1,
      });
      await expect(service.like(1, 1)).rejects.toThrow(ConflictException);
    });

    it('should create a like successfully', async () => {
      prisma.product.findFirst.mockResolvedValue({ id: 1 });
      prisma.productLike.findUnique.mockResolvedValue(null);
      prisma.productLike.create.mockResolvedValue({});
      await service.like(1, 1);
      expect(prisma.productLike.create).toHaveBeenCalledWith({
        data: { userId: 1, productId: 1 },
      });
    });
  });

  describe('unlike', () => {
    it('should throw NotFoundException if not liked', async () => {
      prisma.productLike.findUnique.mockResolvedValue(null);
      await expect(service.unlike(1, 1)).rejects.toThrow(NotFoundException);
    });

    it('should delete the like successfully', async () => {
      prisma.productLike.findUnique.mockResolvedValue({
        userId: 1,
        productId: 1,
      });
      prisma.productLike.delete.mockResolvedValue({});
      await service.unlike(1, 1);
      expect(prisma.productLike.delete).toHaveBeenCalled();
    });
  });
});
