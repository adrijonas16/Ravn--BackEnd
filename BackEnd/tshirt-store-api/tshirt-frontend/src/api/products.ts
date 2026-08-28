import api from './client';
import { Category, Color, PaginatedResponse, Product, ProductDetail, ProductImage, ProductVariant, Size } from '../types';

export interface ProductPayload {
  name: string;
  description: string;
  categoryId: number;
  status?: 'active' | 'disabled';
}

export interface ProductVariantPayload {
  sizeId: number;
  colorId: number;
  sku: string;
  price: number;
  stock: number;
  isActive?: boolean;
}

export interface ProductImagePayload {
  publicUrl: string;
  storageKey?: string;
  altText?: string;
  sortOrder?: number;
  isPrimary?: boolean;
}

export const productsApi = {
  list: (params?: { page?: number; limit?: number; categoryId?: number; search?: string }) =>
    api.get<PaginatedResponse<Product>>('/products', { params }),

  listLiked: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Product>>('/likes/products', { params }),

  get: (id: number) =>
    api.get<ProductDetail>(`/products/${id}`),

  listCategories: () =>
    api.get<Category[]>('/categories'),

  listSizes: () =>
    api.get<Size[]>('/products/options/sizes'),

  listColors: () =>
    api.get<Color[]>('/products/options/colors'),

  create: (data: ProductPayload) =>
    api.post<ProductDetail>('/products', data),

  update: (id: number, data: Partial<ProductPayload>) =>
    api.patch<ProductDetail>(`/products/${id}`, data),

  remove: (id: number) =>
    api.delete(`/products/${id}`),

  createVariant: (productId: number, data: ProductVariantPayload) =>
    api.post<ProductVariant>(`/products/${productId}/variants`, data),

  updateVariant: (productId: number, variantId: number, data: Partial<ProductVariantPayload>) =>
    api.patch<ProductVariant>(`/products/${productId}/variants/${variantId}`, data),

  addImage: (productId: number, data: ProductImagePayload) =>
    api.post<ProductImage>(`/products/${productId}/images`, data),

  updateImage: (productId: number, imageId: number, data: Partial<ProductImagePayload>) =>
    api.patch<ProductImage>(`/products/${productId}/images/${imageId}`, data),

  removeImage: (productId: number, imageId: number) =>
    api.delete(`/products/${productId}/images/${imageId}`),

  like: (productId: number) =>
    api.post(`/products/${productId}/like`),

  unlike: (productId: number) =>
    api.delete(`/products/${productId}/like`),
};
