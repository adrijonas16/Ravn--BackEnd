import api from './client';

export interface NotificationItem {
  id: number;
  type: string;
  recipientEmail: string;
  payload: Record<string, unknown>;
  sentAt?: string | null;
  createdAt: string;
  product?: { id: number; name: string; slug: string } | null;
  productVariant?: {
    id: number;
    sku: string;
    stock: number;
    size: { name: string };
    color: { name: string };
  } | null;
}

export const notificationsApi = {
  list: () => api.get<NotificationItem[]>('/notifications'),
};
