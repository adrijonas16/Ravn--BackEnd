import { Controller, Post, Req, Headers, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import * as express from 'express';
import { WebhooksService } from './webhooks.service';

type StripeWebhookRequest = express.Request & { rawBody?: Buffer };

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private webhooksService: WebhooksService) {}

  @Post('stripe')
  @HttpCode(200)
  @ApiOperation({ summary: 'Handle Stripe webhook events' })
  handleStripeWebhook(
    @Req() req: StripeWebhookRequest,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.webhooksService.handleWebhook(
      req.rawBody ?? req.body,
      signature,
    );
  }
}
