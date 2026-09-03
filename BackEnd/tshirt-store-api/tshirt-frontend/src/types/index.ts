// Tipos que reflejan las respuestas de la API

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: 'manager' | 'client' | 'delivery_person';
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface PromoCode {
  id: number;
  code: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  expiresAt: string;
  usageLimit: number;
  usageCount: number;
  minimumPurchaseAmount: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CurrentUserResponse {
  user: User;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

export interface Size {
  id: number;
  name: string;
  sortOrder: number;
}

export interface Color {
  id: number;
  name: string;
  hexCode?: string | null;
}

export interface ProductImage {
  id: number;
  productVariantId?: number | null;
  storageKey?: string;
  publicUrl: string;
  altText?: string | null;
  sortOrder: number;
  isPrimary: boolean;
}

export interface ProductVariant {
  id: number;
  sku: string;
  price: number | string;
  stock: number;
  isActive: boolean;
  size: Size;
  color: Color;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  status: 'active' | 'disabled';
  category: Category;
  primaryImage?: string | null;
  images?: ProductImage[];
  variants?: ProductVariant[];
  likesCount?: number;
  isLiked?: boolean;
  createdAt: string;
}

export interface ProductDetail extends Product {
  images: ProductImage[];
  variants: ProductVariant[];
  _count?: { likes: number };
}

export interface CartItem {
  id: number;
  productVariantId: number;
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

export interface Address {
  id: number;
  label?: string | null;
  recipientName: string;
  recipientPhone: string;
  line1: string;
  line2?: string | null;
  city: string;
  stateRegion?: string | null;
  postalCode?: string | null;
  countryCode: string;
  isDefault: boolean;
}

export interface OrderSummary {
  id: number;
  orderNumber: string;
  currentStatus: string;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: string | null;
  customer?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
  };
  deliveryPerson?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
  } | null;
  shippingAddress?: {
    recipientName: string;
    recipientPhone: string;
    line1: string;
    line2?: string | null;
    city: string;
    stateRegion?: string | null;
    postalCode?: string | null;
    countryCode: string;
  };
  items?: CartItem[];
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
