import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import {
  LOW_STOCK_NOTIFICATION_JOB,
  NOTIFICATIONS_QUEUE,
} from './notification-jobs.constants';
import { LowStockNotificationJobDto } from './dto/low-stock-notification-job.dto';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsQueueService {
  private readonly logger = new Logger(NotificationsQueueService.name);
  private readonly queuesEnabled: boolean;

  constructor(
    @InjectQueue(NOTIFICATIONS_QUEUE)
    private readonly notificationsQueue: Queue<LowStockNotificationJobDto>,
    private readonly notificationsService: NotificationsService,
    config: ConfigService,
  ) {
    this.queuesEnabled = config.get('QUEUES_ENABLED', 'true') !== 'false';
  }

  async enqueueLowStockNotification(payload: LowStockNotificationJobDto) {
    if (!this.queuesEnabled) {
      await this.notificationsService.createLowStockNotifications(payload);
      return;
    }

    try {
      await this.notificationsQueue.add(LOW_STOCK_NOTIFICATION_JOB, payload, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: 100,
      });
    } catch (error: any) {
      this.logger.error(`Queue enqueue failed: ${error.message}`);
      await this.notificationsService.createLowStockNotifications(payload);
    }
  }
}
