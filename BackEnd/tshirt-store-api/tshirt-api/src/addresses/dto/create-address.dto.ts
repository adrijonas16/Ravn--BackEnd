import {
  IsBoolean,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAddressDto {
  @ApiPropertyOptional({ example: 'Casa' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  label?: string;

  @ApiProperty({ example: 'Demo User' })
  @IsString()
  @MaxLength(200)
  recipientName: string;

  @ApiProperty({ example: '+1234567890' })
  @IsString()
  @MaxLength(30)
  recipientPhone: string;

  @ApiProperty({ example: '123 Main St' })
  @IsString()
  @MaxLength(255)
  line1: string;

  @ApiPropertyOptional({ example: 'Apt 4B' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  line2?: string;

  @ApiProperty({ example: 'San Francisco' })
  @IsString()
  @MaxLength(100)
  city: string;

  @ApiPropertyOptional({ example: 'CA' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  stateRegion?: string;

  @ApiPropertyOptional({ example: '94102' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @ApiProperty({ example: 'US' })
  @IsString()
  @Length(2, 2)
  countryCode: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
