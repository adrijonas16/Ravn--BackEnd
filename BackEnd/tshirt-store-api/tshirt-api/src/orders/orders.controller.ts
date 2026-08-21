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
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
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
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  @ApiQuery({ name: 'minAmount', required: false })
  @ApiQuery({ name: 'maxAmount', required: false })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: OrderStatus,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('minAmount') minAmount?: number,
    @Query('maxAmount') maxAmount?: number,
  ) {
    // Se pasa el objeto user completo para que el service filtre por rol
    return this.ordersService.findAll(user, {
      page,
      limit,
      status,
      fromDate,
      toDate,
      minAmount,
      maxAmount,
    });
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
    return this.ordersService.updateStatus(
      orderId,
      dto.status,
      user,
      dto.reason,
    );
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
    // @Body('reason') extrae solo el campo "reason" del body, no todo el objeto
    @Body('reason') reason?: string,
  ) {
    return this.ordersService.cancelOrder(orderId, user, reason);
  }
}
