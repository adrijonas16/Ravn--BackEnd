import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-user.type';

@ApiTags('Orders')
@Controller('orders')
// Guards a nivel de clase: TODOS los endpoints de órdenes requieren autenticación JWT
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  // POST /orders — crea una orden a partir del carrito activo del usuario
  @Post()
  @Roles('client')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Create an order from cart' })
  create(
    // @CurrentUser es un decorador custom que extrae el usuario del token JWT
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.create(user.id, dto);
  }

  // GET /orders — lista órdenes con filtros (el service filtra según el rol del usuario)
  @Get()
  @ApiOperation({ summary: 'List orders' })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListOrdersQueryDto,
  ) {
    // Se pasa el objeto user completo para que el service filtre por rol
    return this.ordersService.findAll(user, query);
  }

  // GET /orders/:orderId — detalle de una orden (el service valida permisos)
  @Get(':orderId')
  @ApiOperation({ summary: 'Get order details' })
  findOne(
    @Param('orderId', ParseIntPipe) orderId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ordersService.findOne(orderId, user);
  }

  // PATCH /orders/:orderId/status — solo manager y repartidor pueden cambiar estados
  @Patch(':orderId/status')
  @Roles('manager', 'delivery_person')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update order status' })
  updateStatus(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ordersService.updateStatus({
      orderId,
      status: dto.status,
      user,
      reason: dto.reason,
    });
  }

  // POST /orders/:orderId/cancel — cualquier usuario autenticado puede intentar cancelar
  // (el service valida si realmente tiene permiso y si el estado lo permite)
  @Post(':orderId/cancel')
  // HttpCode(200) porque POST normalmente devuelve 201, pero cancelar no crea nada nuevo
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel an order (client, before shipped)' })
  cancelOrder(
    @Param('orderId', ParseIntPipe) orderId: number,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CancelOrderDto,
  ) {
    return this.ordersService.cancelOrder({
      orderId,
      user,
      reason: dto.reason,
    });
  }
}
