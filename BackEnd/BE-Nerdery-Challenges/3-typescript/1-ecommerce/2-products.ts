/**
 * Products - Challenge 1: Product Price Analysis
 *
 * Create a function that analyzes pricing information from an array of products.
 *
 * Requirements:
 * - Create a function called `analyzeProductPrices` that accepts an array of Product objects
 * - The function should return an object containing:
 *   - totalPrice: The sum of all product prices
 *   - averagePrice: The average price of all products (rounded to 2 decimal places)
 *   - mostExpensiveProduct: The complete Product object with the highest price
 *   - cheapestProduct: The complete Product object with the lowest price
 *   - onSaleCount: The number of products that are currently on sale
 *   - averageDiscount: The average discount percentage for products on sale (rounded to 2 decimal places)
 * - Prices should be manage in regular prices and not in sale prices
 * - Use proper TypeScript typing for parameters and return values
 * - Implement the function using efficient array methods
 *
 *
 **/

import { Product, Brand } from "./1-types";
import { readJsonFile } from "./utils/read-json.util";

interface PriceAnalysis {
  totalPrice: number;
  averagePrice: number;
  mostExpensiveProduct: Product | null;
  cheapestProduct: Product | null;
  onSaleCount: number;
  averageDiscount: number;
}

async function analyzeProductPrices(products: Product[]): Promise<PriceAnalysis> {
  // Guard: return sensible defaults for an empty array
  if (products.length === 0) {
    return {
      totalPrice: 0,
      averagePrice: 0,
      mostExpensiveProduct: null,
      cheapestProduct: null,
      onSaleCount: 0,
      averageDiscount: 0,
    };
  }

  const totalPrice = products.reduce((sum, p) => sum + p.price, 0);
  const averagePrice = Math.round((totalPrice / products.length) * 100) / 100;

  const mostExpensiveProduct = products.reduce((max, p) => (p.price > max.price ? p : max), products[0]);
  const cheapestProduct = products.reduce((min, p) => (p.price < min.price ? p : min), products[0]);

  const onSaleProducts = products.filter((p) => p.onSale);
  const onSaleCount = onSaleProducts.length;

  const averageDiscount =
    onSaleCount > 0
      ? Math.round(
          (onSaleProducts.reduce((sum, p) => {
            const discount = ((p.price - (p.salePrice ?? p.price)) / p.price) * 100;
            return sum + discount;
          }, 0) /
            onSaleCount) *
            100
        ) / 100
      : 0;

  return {
    totalPrice,
    averagePrice,
    mostExpensiveProduct,
    cheapestProduct,
    onSaleCount,
    averageDiscount,
  };
}

/**
 *  Challenge 2: Build a Product Catalog with Brand Metadata
 *
 * Create a function that takes arrays of Product and Brand, and returns a new array of enriched product entries. Each entry should include brand details embedded into the product, under a new brandInfo property (excluding the id and isActive fields).
 *  e.g
 *  buildProductCatalog(products: Product[], brands: Brand[]): EnrichedProduct[]

  Requirements:
  - it should return an array of enriched product entries with brand details
  - Only include products where isActive is true and their corresponding brand is also active.
  - If a product's brandId does not match any active brand, it should be excluded.
  - The brandInfo field should include the rest of the brand metadata (name, logo, description, etc.).
 */

type BrandInfo = Omit<Brand, "id" | "isActive">;

interface EnrichedProduct extends Product {
  brandInfo: BrandInfo;
}

async function buildProductCatalog(
  products: Product[],
  brands: Brand[],
): Promise<EnrichedProduct[]> {
  const activeBrandsMap = new Map<string, BrandInfo>();
  for (const brand of brands) {
    if (brand.isActive) {
      const { id, isActive, ...brandInfo } = brand;
      activeBrandsMap.set(String(id), brandInfo);
    }
  }

  return products
    .filter((p) => p.isActive && activeBrandsMap.has(String(p.brandId)))
    .map((p) => ({
      ...p,
      brandInfo: activeBrandsMap.get(String(p.brandId))!,
    }));
}

/**
 * Challenge 3: One image per product
 *
 * Create a function that takes an array of products and returns a new array of products, each with only one image.
 *
 * Requirements:
 * - The function should accept an array of Product objects.
 * - Each product should have only one image in the images array.
 * - The image should be the first one in the images array.
 * - If a product has no images, it should be excluded from the result.
 * - The function should return an array of Product objects with the modified images array.
 * - Use proper TypeScript typing for parameters and return values.
 */

async function filterProductsWithOneImage(
  products: Product[],
): Promise<Product[]> {
  return products
    .filter((p) => p.images.length > 0)
    .map((p) => ({
      ...p,
      images: [p.images[0]],
    }));
}
