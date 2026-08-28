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
import { CreatePaymentLinkDto } from './dto/create-payment-link.dto';
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

  @Post('orders/:orderId/payment-link')
  @ApiOperation({
    summary: 'Create Stripe Checkout link for an existing order',
  })
  createOrderPaymentLink(
    @Param('orderId', ParseIntPipe) orderId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentsService.createOrderPaymentLink(orderId, user.id);
  }

  @Post('payments/payment-link')
  @ApiOperation({ summary: 'Create Payment Link for single product purchase' })
  createPaymentLink(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePaymentLinkDto,
  ) {
    return this.paymentsService.createPaymentLink(
      user.id,
      dto.productVariantId,
      dto.quantity,
      dto.addressId,
    );
  }
}
