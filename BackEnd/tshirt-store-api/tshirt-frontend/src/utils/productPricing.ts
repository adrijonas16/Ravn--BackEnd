import { ProductVariant } from '../types';

export function getPriceRange(variants: ProductVariant[] = []) {
  const prices = variants
    .filter((variant) => variant.isActive && variant.stock > 0)
    .map((variant) => Number(variant.price))
    .filter(Number.isFinite);

  if (prices.length === 0) return 'Sold out';

  const min = Math.min(...prices);
  const max = Math.max(...prices);

  if (min === max) return `$${min.toFixed(2)}`;
  return `$${min.toFixed(2)} - $${max.toFixed(2)}`;
}
