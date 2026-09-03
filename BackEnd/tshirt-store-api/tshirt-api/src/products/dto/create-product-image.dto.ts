import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductImageDto {
  @ApiProperty({
    example: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab',
  })
  @IsUrl({ require_tld: false })
  publicUrl: string;

  @ApiPropertyOptional({ example: 'Front product photo' })
  @IsOptional()
  @IsString()
  altText?: string;

  @ApiPropertyOptional({ example: 'external/product-1-front' })
  @IsOptional()
  @IsString()
  storageKey?: string;

  @ApiPropertyOptional({
    example: 12,
    description: 'Optional variant this image represents',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  productVariantId?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
