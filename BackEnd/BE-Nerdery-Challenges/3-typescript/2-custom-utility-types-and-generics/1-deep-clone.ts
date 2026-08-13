/**
 * Challenge: Create a deep clone function
 *
 * Create a function that takes an object and returns a deep clone of that object. The function should handle nested objects, arrays, and primitive types.
 *
 * Requirements:
 * - The function should accept an object of any type.
 * - It should return a new object that is a deep clone of the original object.
 * - The function should handle nested objects and arrays.
 * - It should handle primitive types (strings, numbers, booleans, null, undefined).
 * - The function should not use any external libraries
 */

// Note: circular references are out of scope for this implementation.
// Passing an object that references itself will cause infinite recursion.
function deepClone<T>(value: T): T {
  // Handle null and primitives
  if (value === null || typeof value !== "object") {
    return value;
  }

  // Handle Date objects
  if (value instanceof Date) {
    return new Date(value.getTime()) as T;
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return value.map((item) => deepClone(item)) as T;
  }

  // Handle plain objects
  const result = {} as T;
  for (const key in value) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      result[key] = deepClone(value[key]);
    }
  }
  return result;
}
