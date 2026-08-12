import api from './client';
import { Product, ProductDetail, PaginatedResponse, Category } from '../types';

export const productsApi = {
  list: (params?: { page?: number; limit?: number; categoryId?: number; search?: string }) =>
    api.get<PaginatedResponse<Product>>('/products', { params }),

  get: (id: number) =>
    api.get<ProductDetail>(`/products/${id}`),

  listCategories: () =>
    api.get<Category[]>('/categories'),

  like: (productId: number) =>
    api.post(`/products/${productId}/like`),

  unlike: (productId: number) =>
    api.delete(`/products/${productId}/like`),
};
