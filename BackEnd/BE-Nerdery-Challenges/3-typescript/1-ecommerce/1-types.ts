/**
 * Challenge 1: Type Definitions for Product Catalog
 *
 * You need to define proper TypeScript types for the product catalog data.
 * These types should accurately represent the structure of the JSON data and establish
 * the relationships between different entities (e.g., products and brands).
 *
 * The JSON data is provided in the `data` folder.
 *
 * Consider:
 * - Handle all of the properties in the JSON data as accurately as possible in typescript types
 * - Use appropriate types for each property (e.g., string, number, boolean, etc.)
 * - Optional properties and mandatory properties
 * - The use of union types for properties that can have multiple types
 * - The use of enums for properties that can have a limited set of values
 * - How entities relate — a product's `brandId` points at a brand
 */

// PRODUCTS JSON

export interface ProductImage {
  id: number;
  url: string;
  alt: string;
  isMain: boolean;
}

export interface ProductSpecifications {
  material: string;
  weight: string;
  cushioning: string;
  closure: string;
  archSupport?: string;
  shaftHeight?: string;
  ankleSupport?: string;
  lining?: string;
  heelDrop?: string;
  heelHeight?: string;
  flexibility?: string;
  insulation?: string;
  waterproofing?: string;
}

export interface Product {
  id: number;
  name: string;
  departmentId: number;
  categoryId: number;
  brandId: number;
  linkId: string;
  refId: string;
  isVisible: boolean;
  description: string;
  descriptionShort: string;
  releaseDate: string;
  keywords: string;
  title: string;
  isActive: boolean;
  taxCode: string;
  metaTagDescription: string;
  supplierId: number;
  showWithoutStock: boolean;
  adWordsRemarketingCode?: string;
  lomadeeCampaignCode?: string;
  score: number;
  price: number;
  salePrice: number | null;
  onSale: boolean;
  colors: string[];
  sizes: number[];
  tags: string[];
  images: ProductImage[];
  specifications: ProductSpecifications;
}

// CATEGORIES JSON

export interface CategoryFilter {
  name: string;
  values: string[];
}

export interface Category {
  id: number;
  name: string;
  departmentId: number;
  description: string;
  keywords: string;
  isActive: boolean;
  iconUrl: string;
  bannerUrl: string;
  displayOrder: number;
  metaDescription: string;
  filters: CategoryFilter[];
}

// BRANDS JSON

export interface BrandSocialMedia {
  instagram: string;
  twitter: string;
  facebook: string;
}

export interface Brand {
  id: number | string;
  name: string;
  logo: string;
  description: string;
  foundedYear: number;
  website: string;
  isActive: boolean;
  headquarters: string;
  signature: string;
  socialMedia: BrandSocialMedia;
}

// DEPARTMENTS JSON

export interface Department {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  displayOrder: number;
  iconUrl: string;
  bannerUrl: string;
  metaDescription: string;
  featuredCategories: number[];
  slug: string;
}
