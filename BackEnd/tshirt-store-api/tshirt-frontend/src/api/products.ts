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
  productVariantId?: number;
}

export interface ProductImageUploadPayload {
  filename: string;
  contentType: string;
  altText?: string;
  sortOrder?: number;
  isPrimary?: boolean;
  productVariantId?: number;
}

export interface ProductImageUploadResponse {
  image: ProductImage;
  upload: {
    uploadUrl: string;
    publicUrl: string;
    storageKey: string;
    expiresInSeconds: number;
  };
}

export interface ProductImageFileUploadPayload {
  file: File;
  altText?: string;
  sortOrder?: number;
  isPrimary?: boolean;
  productVariantId?: number;
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

  createImageUpload: (productId: number, data: ProductImageUploadPayload) =>
    api.post<ProductImageUploadResponse>(`/products/${productId}/images/upload-url`, data),

  uploadImage: (productId: number, data: ProductImageFileUploadPayload) => {
    const formData = new FormData();
    formData.append('file', data.file);
    if (data.altText) formData.append('altText', data.altText);
    if (data.sortOrder !== undefined) formData.append('sortOrder', String(data.sortOrder));
    if (data.isPrimary !== undefined) formData.append('isPrimary', String(data.isPrimary));
    if (data.productVariantId !== undefined) {
      formData.append('productVariantId', String(data.productVariantId));
    }

    return api.post<ProductImage>(`/products/${productId}/images/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  updateImage: (productId: number, imageId: number, data: Partial<ProductImagePayload>) =>
    api.patch<ProductImage>(`/products/${productId}/images/${imageId}`, data),

  removeImage: (productId: number, imageId: number) =>
    api.delete(`/products/${productId}/images/${imageId}`),

  like: (productId: number) =>
    api.post(`/products/${productId}/like`),

  unlike: (productId: number) =>
    api.delete(`/products/${productId}/like`),
};
