import { OrderStatus } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';

export class UpdateOrderStatusCommandDto {
  orderId: number;
  status: OrderStatus;
  user: AuthenticatedUser;
  reason?: string;
}
