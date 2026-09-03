import { Controller, Post, Req, Headers, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import * as express from 'express';
import { WebhooksService } from './webhooks.service';

type StripeWebhookRequest = express.Request & { rawBody?: Buffer };

function getStripePayload(req: StripeWebhookRequest) {
  if (Buffer.isBuffer(req.rawBody)) return req.rawBody;
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body);
  return Buffer.from(JSON.stringify(req.body));
}

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
    return this.webhooksService.handleWebhook(getStripePayload(req), signature);
  }
}
