import { Job } from 'bullmq';

jest.mock('@nestjs/bullmq', () => ({
  Processor: () => () => undefined,
  WorkerHost: class {},
}));

import { LOW_STOCK_NOTIFICATION_JOB } from './notification-jobs.constants';
import { NotificationsProcessor } from './notifications.processor';
import { NotificationsService } from './notifications.service';

describe('NotificationsProcessor', () => {
  const payload = {
    productId: 1,
    productVariantId: 2,
    stock: 3,
  };

  function buildProcessor() {
    const createLowStockNotifications = jest.fn();
    const notificationsService = {
      createLowStockNotifications,
    } as unknown as jest.Mocked<NotificationsService>;

    const processor = new NotificationsProcessor(notificationsService);

    return { processor, createLowStockNotifications };
  }

  it('processes low-stock notification jobs', async () => {
    const { processor, createLowStockNotifications } = buildProcessor();

    await processor.process({
      name: LOW_STOCK_NOTIFICATION_JOB,
      data: payload,
    } as Job);

    expect(createLowStockNotifications).toHaveBeenCalledWith(payload);
  });

  it('ignores unknown notification jobs', async () => {
    const { processor, createLowStockNotifications } = buildProcessor();

    await processor.process({
      name: 'unknown-job',
      data: payload,
    } as Job);

    expect(createLowStockNotifications).not.toHaveBeenCalled();
  });
});
