import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';

// @Module define un módulo de NestJS: agrupa controladores, servicios y dependencias relacionadas
@Module({
  imports: [
    // PassportModule habilita el sistema de autenticación por estrategias (JWT, OAuth, etc.)
    PassportModule,
    // registerAsync configura JwtModule de forma asíncrona, leyendo variables de entorno
    JwtModule.registerAsync({
      // inject: le dice a NestJS que pase ConfigService al useFactory
      inject: [ConfigService],
      // useFactory: función que retorna la configuración del módulo JWT
      useFactory: (config: ConfigService) => ({
        // La clave secreta para firmar/verificar tokens (viene de .env)
        secret: config.getOrThrow<string>('JWT_SECRET'),
        // Tiempo de expiración del token (default: 1 día si no está en .env)
        signOptions: { expiresIn: config.get('JWT_EXPIRATION', '1d') },
      }),
    }),
  ],
  controllers: [AuthController],
  // providers: servicios disponibles dentro de este módulo
  providers: [AuthService, JwtStrategy],
  // exports: lo que otros módulos pueden usar al importar AuthModule
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
