import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
// Reflector: lee metadata adjunta a controladores/métodos con decoradores
import { Reflector } from '@nestjs/core';

// Clave usada para guardar/leer los roles requeridos en la metadata
export const ROLES_KEY = 'roles';

// ─── DECORADOR @Roles() ───
// Uso: @Roles('manager', 'client') encima de un endpoint
// Guarda los roles permitidos como metadata en el método/clase
// Ejemplo: @Roles('manager') → solo managers pueden acceder a ese endpoint
export function Roles(...roles: string[]) {
  return (
    target: any,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor,
  ) => {
    // Guarda los roles como metadata usando la Reflect API
    // descriptor?.value es el método decorado; target es la clase si se aplica a nivel de clase
    const metadataTarget = descriptor?.value ?? target;
    Reflect.defineMetadata(ROLES_KEY, roles, metadataTarget);
    return descriptor ?? target;
  };
}

// ─── GUARD DE ROLES ───
// Un "guard" es como un portero: decide si el request puede pasar o no
// Se ejecuta ANTES del controlador — si retorna false o lanza excepción, el request se bloquea
// CanActivate: interfaz que obliga a implementar canActivate()
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Lee los roles requeridos que se definieron con @Roles() en el endpoint
    // getAllAndOverride: busca primero en el método, luego en la clase
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [
        context.getHandler(), // el método del controlador (ej: createProduct)
        context.getClass(), // la clase del controlador (ej: ProductsController)
      ],
    );

    // Si no hay @Roles() definido, permite el acceso (no hay restricción de rol)
    if (!requiredRoles) return true;

    // Extrae el usuario del request (puesto ahí por el JwtAuthGuard)
    const { user } = context.switchToHttp().getRequest();
    // Verifica que el rol del usuario esté en la lista de roles permitidos
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
