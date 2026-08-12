import { Injectable } from '@nestjs/common';
// AuthGuard: guard pre-construido de @nestjs/passport que maneja autenticación
import { AuthGuard } from '@nestjs/passport';

// ─── GUARD DE AUTENTICACIÓN JWT ───
// Este guard se pone en los endpoints que requieren usuario autenticado: @UseGuards(JwtAuthGuard)
// Lo que hace internamente:
// 1. Extrae el token JWT del header "Authorization: Bearer <token>"
// 2. Verifica que el token sea válido (no expirado, firma correcta)
// 3. Decodifica el payload del token (id, email, role del usuario)
// 4. Pone los datos del usuario en request.user para que otros guards/decoradores los usen
// AuthGuard('jwt') busca una estrategia llamada 'jwt' registrada con @nestjs/passport
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
