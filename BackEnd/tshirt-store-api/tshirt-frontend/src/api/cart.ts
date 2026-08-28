import api from './client';
import { Cart } from '../types';

export const cartApi = {
  get: () => api.get<Cart>('/cart'),

  addItem: (productVariantId: number, quantity: number) =>
    api.post<Cart>('/cart/items', { productVariantId, quantity }),

  updateItem: (itemId: number, quantity: number) =>
    api.patch<Cart>(`/cart/items/${itemId}`, { quantity }),

  removeItem: (itemId: number) =>
    api.delete(`/cart/items/${itemId}`),
};
