import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
// passport-jwt: librería que sabe cómo extraer y verificar tokens JWT de los requests
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

// Interfaz que define la estructura del contenido (payload) dentro del token JWT
export interface JwtPayload {
  sub: number; // "subject" = id del usuario
  email: string;
  role: string;
}

@Injectable()
// PassportStrategy(Strategy) crea una clase base que Passport usa para autenticar con JWT
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    // super() configura cómo Passport extrae y valida el token
    super({
      // Extrae el token del header "Authorization: Bearer <token>"
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // No aceptar tokens expirados
      ignoreExpiration: false,
      // La misma clave secreta usada para firmar los tokens
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  // Passport llama a validate() después de verificar que el token es válido
  // Lo que retorne este método se adjunta a req.user en cada request autenticado
  async validate(payload: JwtPayload) {
    // Busca el usuario en la BD para confirmar que todavía existe y está activo
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { role: true },
    });

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException();
    }

    // Este objeto queda disponible como req.user en los controladores protegidos
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.name,
    };
  }
}
