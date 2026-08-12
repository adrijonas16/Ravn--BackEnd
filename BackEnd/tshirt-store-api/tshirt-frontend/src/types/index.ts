// Tipos que reflejan las respuestas de la API

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'manager' | 'client' | 'delivery_person';
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

export interface ProductImage {
  id: number;
  publicUrl: string;
  altText?: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface Sku {
  id: number;
  sku: string;
  price: number | string;
  stock: number;
  isActive: boolean;
  size: { id: number; name: string };
  color: { id: number; name: string; hexCode?: string };
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  status: 'active' | 'disabled';
  category: Category;
  primaryImage?: string | null;
  likesCount?: number;
  isLiked?: boolean;
  createdAt: string;
}

export interface ProductDetail extends Product {
  images: ProductImage[];
  skus: Sku[];
  _count?: { likes: number };
}

export interface CartItem {
  id: number;
  productSkuId: number;
  productName: string;
  skuCode: string;
  sizeName: string;
  colorName: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Cart {
  id: number;
  items: CartItem[];
  totalAmount: number;
}

export interface OrderSummary {
  id: number;
  orderNumber: string;
  currentStatus: string;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: string | null;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}
