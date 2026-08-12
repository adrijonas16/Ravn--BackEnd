// createParamDecorator: permite crear decoradores personalizados para parámetros de métodos
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Tipo que define la forma del usuario autenticado (extraído del token JWT)
export class AuthenticatedUser {
  id: number;
  email: string;
  role: string;
}

// ─── DECORADOR @CurrentUser() ───
// Decorador de parámetro personalizado que extrae el usuario del request
// El JwtAuthGuard pone el usuario en request.user — este decorador lo hace accesible fácilmente
//
// Uso en un controlador:
//   @Get('profile')
//   getProfile(@CurrentUser() user: AuthenticatedUser) { ... }     ← obtiene el objeto completo
//   getProfile(@CurrentUser('id') userId: number) { ... }          ← obtiene solo el id
//   getProfile(@CurrentUser('role') role: string) { ... }          ← obtiene solo el rol
export const CurrentUser = createParamDecorator(
  // data: el argumento pasado al decorador (ej: 'id', 'email', o undefined si no se pasa nada)
  // ctx: el contexto de ejecución (acceso al request, response, etc.)
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    // request.user fue puesto por el JwtAuthGuard tras verificar el token
    const user = request.user as AuthenticatedUser;
    // Si se pasa un campo específico (ej: 'id'), retorna solo ese campo; si no, retorna todo el objeto
    return data ? user?.[data] : user;
  },
);
