import api from './client';
import { PaginatedResponse, PromoCode } from '../types';

export interface PromoCodePayload {
  code: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  expiresAt: string;
  usageLimit: number;
  minimumPurchaseAmount?: number;
  isActive?: boolean;
}

export interface PromoPreview {
  code: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
}

export const promoCodesApi = {
  list: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<PromoCode>>('/promo-codes', { params }),

  create: (data: PromoCodePayload) =>
    api.post<PromoCode>('/promo-codes', data),

  update: (id: number, data: Partial<Pick<PromoCodePayload, 'expiresAt' | 'usageLimit' | 'isActive'>>) =>
    api.patch<PromoCode>(`/promo-codes/${id}`, data),

  preview: (code: string) =>
    api.post<PromoPreview>('/promo-codes/preview', { code }),
};
