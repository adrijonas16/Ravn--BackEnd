import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { ListDeliveryOrdersQueryDto } from './dto/list-delivery-orders-query.dto';
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
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListDeliveryOrdersQueryDto,
  ) {
    return this.ordersService.findAll(user, query);
  }

  @Post('orders/:orderId/deliver')
  @ApiOperation({ summary: 'Mark order as delivered (delivery person only)' })
  markDelivered(
    @CurrentUser() user: AuthenticatedUser,
    @Param('orderId', ParseIntPipe) orderId: number,
  ) {
    return this.ordersService.updateStatus({
      orderId,
      status: OrderStatus.delivered,
      user,
      reason: 'Delivered by assigned delivery person',
    });
  }
}
