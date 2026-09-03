import {
  IsBoolean,
  IsInt,
  IsMimeType,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductImageUploadDto {
  @ApiProperty({ example: 'front-view.jpg' })
  @IsString()
  @MaxLength(255)
  filename: string;

  @ApiProperty({ example: 'image/jpeg' })
  @IsMimeType()
  contentType: string;

  @ApiPropertyOptional({ example: 'Front product photo' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  altText?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
