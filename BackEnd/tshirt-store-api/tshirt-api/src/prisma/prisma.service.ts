// OnModuleInit / OnModuleDestroy: interfaces de NestJS para ejecutar código al iniciar/cerrar el módulo
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
// PrismaClient: el cliente auto-generado por Prisma que tiene métodos para cada tabla (user, product, etc.)
import { PrismaClient } from '@prisma/client';

// @Injectable(): marca esta clase como un servicio que NestJS puede inyectar en otros servicios/controladores
// "extends PrismaClient" — hereda TODOS los métodos de Prisma (this.user.findMany(), this.product.create(), etc.)
// "implements OnModuleInit, OnModuleDestroy" — obliga a definir los métodos del ciclo de vida
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  // Se ejecuta automáticamente cuando NestJS inicializa este módulo — abre la conexión a la BD
  async onModuleInit() {
    await this.$connect();
  }

  // Se ejecuta cuando la app se cierra — cierra la conexión a la BD limpiamente
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
