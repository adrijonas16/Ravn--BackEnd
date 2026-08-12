// ─── CASL: librería de autorización basada en permisos ───
// A diferencia de un simple "if (user.role === 'admin')", CASL define reglas declarativas:
// "El manager PUEDE crear/editar/borrar productos" → can('manage', 'Product')
// Esto permite verificar permisos de forma granular y centralizada

// AbilityBuilder: constructor de reglas (can/cannot)
// MongoAbility: el tipo de "ability" que CASL usa internamente
import {
  AbilityBuilder,
  createMongoAbility,
  MongoAbility,
  InferSubjects,
} from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';

// Acciones posibles — 'manage' significa TODAS las acciones (create + read + update + delete)
export type Actions = 'manage' | 'create' | 'read' | 'update' | 'delete';

// Recursos/entidades sobre los que se aplican las acciones
// 'all' significa TODOS los recursos
export type Subjects =
  | 'Product'
  | 'ProductSku'
  | 'Order'
  | 'Cart'
  | 'PromoCode'
  | 'User'
  | 'all';

// Tipo que combina acciones + recursos: [acción, recurso] → ej: ['create', 'Product']
export type AppAbility = MongoAbility<[Actions, Subjects]>;

@Injectable()
export class CaslAbilityFactory {
  // Crea las reglas de permisos según el rol del usuario autenticado
  // Se llama cada vez que un guard necesita verificar si el usuario tiene permiso
  createForUser(user: AuthenticatedUser): AppAbility {
    // can(): otorga permiso | cannot(): niega permiso | build(): construye el objeto final
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(
      createMongoAbility,
    );

    // Cada rol tiene permisos diferentes — patrón RBAC (Role-Based Access Control)
    switch (user.role) {
      case 'manager':
        // 'manage' = puede hacer TODO (crear, leer, editar, borrar) con productos y SKUs
        can('manage', 'Product');
        can('manage', 'ProductSku');
        can('read', 'Order');
        can('update', 'Order'); // puede cambiar estado de las órdenes
        can('manage', 'PromoCode');
        break;

      case 'client':
        can('read', 'Product'); // solo puede VER productos, no crearlos ni editarlos
        can('manage', 'Cart'); // control total de su carrito
        can('create', 'Order'); // puede hacer pedidos
        can('read', 'Order'); // puede ver sus pedidos
        can('delete', 'Order'); // puede cancelar pedidos
        break;

      case 'delivery_person':
        // Solo puede ver y actualizar órdenes (ej: marcar como "entregado")
        can('read', 'Order');
        can('update', 'Order');
        break;
    }

    // build() compila todas las reglas en un objeto Ability que se puede consultar:
    // ability.can('create', 'Product') → true/false
    return build();
  }
}
