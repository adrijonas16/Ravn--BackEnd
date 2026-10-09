import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignDeliveryDto {
  @ApiProperty({ description: 'ID of the delivery person to assign' })
  @IsInt()
  @Min(1)
  deliveryUserId: number;
}
