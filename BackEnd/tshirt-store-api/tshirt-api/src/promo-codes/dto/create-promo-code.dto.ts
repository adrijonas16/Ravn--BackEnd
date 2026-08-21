import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DiscountType } from '@prisma/client';

export class CreatePromoCodeDto {
  @ApiProperty({ example: 'SUMMER20' })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({ enum: DiscountType, example: DiscountType.percentage })
  @IsEnum(DiscountType)
  discountType: DiscountType;

  @ApiProperty({ example: 20 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  discountValue: number;

  @ApiProperty({ example: '2026-12-31T23:59:59.000Z' })
  @IsDateString()
  expiresAt: string;

  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(1)
  usageLimit: number;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minimumPurchaseAmount?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
