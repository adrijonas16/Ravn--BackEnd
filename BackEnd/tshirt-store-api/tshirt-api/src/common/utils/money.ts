import { Decimal } from '@prisma/client/runtime/library';

/**
 * Converts a Prisma Decimal to a JS number rounded to 2 decimal places.
 * Use this for all money/price fields to ensure consistent precision.
 */
export function toMoney(value: Decimal | number | string): number {
  return Math.round(Number(value) * 100) / 100;
}
