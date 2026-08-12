/**
 *  Challenge 4: Get Countries with Brands and Amount of Products
 *
 * Create a function that takes an array of brands and products, and returns the countries with the amount of products available in each country.
 *
 * Requirements:
 * - The function should accept an array of Brand objects and an array of Product objects.
 * - Each brand should have a country property.
 * - Each product should have a brandId property that corresponds to the id of a brand.
 * - The function should return an array of objects, each containing a country and the amount of products available in that country.
 * - The amount of products should be calculated by counting the number of products that have a brandId matching the id of a brand in the same country.
 * - The return should be a type that allow us to define the country name as a key and the amount of products as a value.
 */

import { Brand, Product } from "./1-types";

async function getCountriesWithBrandsAndProductCount(
  brands: Brand[],
  products: Product[],
): Promise<Record<string, number>> {
  // Build a map from brand id to the country extracted from headquarters
  const brandCountryMap = new Map<string, string>();
  for (const brand of brands) {
    // headquarters is like "Los Angeles, USA" — country is the part after the last comma
    const parts = brand.headquarters.split(",");
    const country = parts[parts.length - 1].trim();
    brandCountryMap.set(String(brand.id), country);
  }

  const result: Record<string, number> = {};

  for (const product of products) {
    const country = brandCountryMap.get(String(product.brandId));
    if (country) {
      result[country] = (result[country] ?? 0) + 1;
    }
  }

  return result;
}
