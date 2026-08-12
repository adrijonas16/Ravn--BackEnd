import api from './client';
import { Cart } from '../types';

export const cartApi = {
  get: () => api.get<Cart>('/cart'),

  addItem: (productSkuId: number, quantity: number) =>
    api.post<Cart>('/cart/items', { productSkuId, quantity }),

  updateItem: (itemId: number, quantity: number) =>
    api.patch<Cart>(`/cart/items/${itemId}`, { quantity }),

  removeItem: (itemId: number) =>
    api.delete(`/cart/items/${itemId}`),
};
