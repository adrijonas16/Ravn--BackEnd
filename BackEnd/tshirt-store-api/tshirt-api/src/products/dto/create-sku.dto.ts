import { IsString, IsInt, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSkuDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  sizeId: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  colorId: number;

  @ApiProperty({ example: 'MST-BLU-L' })
  @IsString()
  sku: string;

  @ApiProperty({ example: 29.99 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @ApiProperty({ example: 50 })
  @IsInt()
  @Min(0)
  stock: number;
}
