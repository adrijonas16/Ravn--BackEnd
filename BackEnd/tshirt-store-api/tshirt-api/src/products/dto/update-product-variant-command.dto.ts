import type { UpdateProductVariantDto } from './update-sku.dto';

export class UpdateProductVariantCommandDto {
  productId: number;
  productVariantId: number;
  dto: UpdateProductVariantDto;
}
