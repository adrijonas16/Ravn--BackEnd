import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsQueueService } from './notifications-queue.service';
import { NotificationsProcessor } from './notifications.processor';
import { NOTIFICATIONS_QUEUE } from './notification-jobs.constants';

@Module({
  imports: [BullModule.registerQueue({ name: NOTIFICATIONS_QUEUE })],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsQueueService,
    ...(process.env.QUEUES_ENABLED === 'false' ? [] : [NotificationsProcessor]),
  ],
  exports: [NotificationsQueueService, NotificationsService],
})
export class NotificationsModule {}
