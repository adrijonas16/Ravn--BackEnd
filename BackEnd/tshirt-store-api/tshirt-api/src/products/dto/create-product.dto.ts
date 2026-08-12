import { IsString, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Mountain Sunset Tee' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'A beautiful mountain sunset graphic tee' })
  @IsString()
  description: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  categoryId: number;
}
