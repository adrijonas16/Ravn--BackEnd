import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { OrdersService } from '../orders/orders.service';

@ApiTags('Delivery')
@Controller('delivery')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('delivery_person')
@ApiBearerAuth()
export class DeliveryController {
  constructor(private ordersService: OrdersService) {}

  @Get('orders')
  @ApiOperation({ summary: 'List assigned orders (delivery person only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: [OrderStatus.shipped, OrderStatus.delivered],
  })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: OrderStatus,
  ) {
    return this.ordersService.findAll(user, {
      page: Number(page),
      limit: Number(limit),
      status,
    });
  }

  @Post('orders/:orderId/deliver')
  @ApiOperation({ summary: 'Mark order as delivered (delivery person only)' })
  markDelivered(
    @CurrentUser() user: AuthenticatedUser,
    @Param('orderId', ParseIntPipe) orderId: number,
  ) {
    return this.ordersService.updateStatus(
      orderId,
      OrderStatus.delivered,
      user,
      'Delivered by assigned delivery person',
    );
  }
}
