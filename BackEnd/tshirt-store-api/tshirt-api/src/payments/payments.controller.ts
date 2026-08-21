import {
  Controller,
  Post,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-user.type';

@ApiTags('Payments')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('orders/:orderId/payment-intent')
  @ApiOperation({ summary: 'Create Payment Intent for cart checkout' })
  createPaymentIntent(
    @Param('orderId', ParseIntPipe) orderId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentsService.createPaymentIntent(orderId, user.id);
  }

  @Post('payments/payment-link')
  @ApiOperation({ summary: 'Create Payment Link for single product purchase' })
  createPaymentLink(
    @CurrentUser() user: AuthenticatedUser,
    @Body('productSkuId') productSkuId: number,
    @Body('quantity') quantity: number,
    @Body('addressId') addressId: number,
  ) {
    return this.paymentsService.createPaymentLink(
      user.id,
      productSkuId,
      quantity,
      addressId,
    );
  }
}
