export const NOTIFICATIONS_QUEUE = 'notifications';
export const LOW_STOCK_NOTIFICATION_JOB = 'low-stock-notification';
export const LOW_STOCK_NOTIFICATION_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 2000 },
  removeOnComplete: true,
  removeOnFail: 100,
};
