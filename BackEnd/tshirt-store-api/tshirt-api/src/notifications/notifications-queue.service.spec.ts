import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';

jest.mock('@nestjs/bullmq', () => ({
  InjectQueue: () => () => undefined,
}));

import {
  LOW_STOCK_NOTIFICATION_JOB,
  LOW_STOCK_NOTIFICATION_JOB_OPTIONS,
} from './notification-jobs.constants';
import { NotificationsQueueService } from './notifications-queue.service';
import { NotificationsService } from './notifications.service';

describe('NotificationsQueueService', () => {
  const payload = {
    productId: 1,
    productVariantId: 2,
    stock: 3,
  };

  function buildService(queuesEnabled = 'true') {
    const add = jest.fn();
    const createLowStockNotifications = jest.fn();
    const queue = {
      add,
    } as unknown as jest.Mocked<Queue>;
    const notificationsService = {
      createLowStockNotifications,
    } as unknown as jest.Mocked<NotificationsService>;
    const configService = {
      get: jest.fn().mockReturnValue(queuesEnabled),
    } as unknown as ConfigService;

    const service = new NotificationsQueueService(
      queue,
      notificationsService,
      configService,
    );

    return { service, add, createLowStockNotifications };
  }

  it('enqueues low-stock notifications with retry options', async () => {
    const { service, add, createLowStockNotifications } = buildService();

    await service.enqueueLowStockNotification(payload);

    expect(add).toHaveBeenCalledWith(
      LOW_STOCK_NOTIFICATION_JOB,
      payload,
      LOW_STOCK_NOTIFICATION_JOB_OPTIONS,
    );
    expect(createLowStockNotifications).not.toHaveBeenCalled();
  });

  it('runs the notification directly when queues are disabled', async () => {
    const { service, add, createLowStockNotifications } = buildService('false');

    await service.enqueueLowStockNotification(payload);

    expect(add).not.toHaveBeenCalled();
    expect(createLowStockNotifications).toHaveBeenCalledWith(payload);
  });

  it('falls back to direct notification when enqueue fails', async () => {
    const { service, add, createLowStockNotifications } = buildService();
    add.mockRejectedValueOnce(new Error('Redis unavailable'));

    await service.enqueueLowStockNotification(payload);

    expect(createLowStockNotifications).toHaveBeenCalledWith(payload);
  });
});
