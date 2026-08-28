import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';

export class CancelOrderCommandDto {
  orderId: number;
  user: AuthenticatedUser;
  reason?: string;
}
