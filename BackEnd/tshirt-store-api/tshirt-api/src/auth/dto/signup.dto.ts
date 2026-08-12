// class-validator: decoradores que validan automáticamente los datos del request
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
// @ApiProperty: documenta cada campo en Swagger para que se vea en la UI de pruebas
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// DTO (Data Transfer Object): define la forma exacta de los datos que espera el endpoint
// NestJS valida automáticamente el body del request contra estas reglas
export class SignUpDto {
  @ApiProperty({ example: 'john@example.com' })
  // @IsEmail() rechaza el request si el valor no tiene formato de email válido
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Secret123!' })
  @IsString()
  // @MinLength(8) rechaza contraseñas con menos de 8 caracteres
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName: string;

  // @ApiPropertyOptional marca este campo como opcional en la documentación Swagger
  @ApiPropertyOptional({ example: '+1234567890' })
  // @IsOptional() permite que este campo no venga en el request
  @IsOptional()
  @IsString()
  phone?: string;
}
