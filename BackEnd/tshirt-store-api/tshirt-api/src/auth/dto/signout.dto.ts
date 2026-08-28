import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class SignOutDto {
  @ApiPropertyOptional({
    example: 'a5b0b45dce8f4a0f9fca9e7c8e8e9d1b...',
    description: 'Refresh token to revoke for this session',
  })
  @IsOptional()
  @IsString()
  @MinLength(32)
  refreshToken?: string;
}
