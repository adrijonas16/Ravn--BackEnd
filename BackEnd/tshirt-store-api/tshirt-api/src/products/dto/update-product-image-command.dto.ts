import type { UpdateProductImageDto } from './update-product-image.dto';

export class UpdateProductImageCommandDto {
  productId: number;
  imageId: number;
  dto: UpdateProductImageDto;
}
