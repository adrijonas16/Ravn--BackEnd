import api from './client';
import { OrderSummary, PaginatedResponse } from '../types';

export const ordersApi = {
  create: (addressId: number, promoCode?: string) =>
    api.post('/orders', { addressId, promoCode }),

  list: (params?: { page?: number; limit?: number; status?: string; fromDate?: string; toDate?: string }) =>
    api.get<PaginatedResponse<OrderSummary>>('/orders', { params }),

  get: (id: number) =>
    api.get(`/orders/${id}`),

  updateStatus: (id: number, status: string, reason?: string) =>
    api.patch(`/orders/${id}/status`, { status, reason }),

  cancel: (id: number, reason?: string) =>
    api.post(`/orders/${id}/cancel`, { reason }),
};
