import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  constructor(private prisma: PrismaService) {}

  findAll(userId: number) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async create(userId: number, dto: CreateAddressDto) {
    const data = this.normalize(dto);

    return this.prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.address.create({
        data: { ...data, userId },
      });
    });
  }

  async update(userId: number, addressId: number, dto: UpdateAddressDto) {
    await this.ensureOwnAddress(userId, addressId);
    const data = this.normalize(dto);

    return this.prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true, NOT: { id: addressId } },
          data: { isDefault: false },
        });
      }

      return tx.address.update({
        where: { id: addressId },
        data,
      });
    });
  }

  async remove(userId: number, addressId: number) {
    await this.ensureOwnAddress(userId, addressId);
    await this.prisma.address.delete({ where: { id: addressId } });
  }

  private async ensureOwnAddress(userId: number, addressId: number) {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!address) throw new NotFoundException('Address not found');
    return address;
  }

  private normalize<T extends CreateAddressDto | UpdateAddressDto>(dto: T): T {
    return {
      ...dto,
      countryCode: dto.countryCode?.toUpperCase(),
    };
  }
}
