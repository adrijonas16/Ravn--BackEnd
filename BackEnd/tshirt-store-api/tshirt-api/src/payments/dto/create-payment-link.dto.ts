import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class CreatePaymentLinkDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  productVariantId: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  addressId: number;
}
