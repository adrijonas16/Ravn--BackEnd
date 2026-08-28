import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  LOW_STOCK_NOTIFICATION_JOB,
  NOTIFICATIONS_QUEUE,
} from './notification-jobs.constants';
import { LowStockNotificationJobDto } from './dto/low-stock-notification-job.dto';
import { NotificationsService } from './notifications.service';

@Processor(NOTIFICATIONS_QUEUE)
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(private readonly notificationsService: NotificationsService) {
    super();
  }

  async process(job: Job<LowStockNotificationJobDto>) {
    if (job.name !== LOW_STOCK_NOTIFICATION_JOB) {
      this.logger.warn(`Unknown notification job ignored: ${job.name}`);
      return;
    }

    await this.notificationsService.createLowStockNotifications(job.data);
  }
}
