import type { UpdateAddressDto } from './update-address.dto';

export class UpdateAddressCommandDto {
  userId: number;
  addressId: number;
  dto: UpdateAddressDto;
}
