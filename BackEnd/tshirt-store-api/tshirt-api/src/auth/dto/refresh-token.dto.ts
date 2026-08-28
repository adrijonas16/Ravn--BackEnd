import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'a5b0b45dce8f4a0f9fca9e7c8e8e9d1b...',
    description: 'Opaque refresh token returned by signin/signup',
  })
  @IsString()
  @MinLength(32)
  refreshToken: string;
}
