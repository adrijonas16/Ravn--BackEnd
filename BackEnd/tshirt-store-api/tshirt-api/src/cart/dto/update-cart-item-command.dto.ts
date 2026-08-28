import type { UpdateCartItemDto } from './update-cart-item.dto';

export class UpdateCartItemCommandDto {
  userId: number;
  itemId: number;
  dto: UpdateCartItemDto;
}
