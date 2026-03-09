import { Room } from '@/types/room';

export interface RoomPricing {
  /** The final price to display (bold, prominent) */
  finalPrice: number;
  /** The original/strikethrough price */
  originalPrice: number;
  /** Discount percentage (0 if no discount) */
  discountPercent: number;
  /** Amount saved */
  savings: number;
  /** Whether max/min prices were used directly */
  hasExplicitPricing: boolean;
}

/**
 * Centralized pricing logic for room display.
 *
 * Rules:
 * - If BOTH maximum_price and minimum_price exist → use them directly (no calculated discount).
 * - Otherwise → use `price` with an automatic 25% discount.
 */
export const getRoomPricing = (room: Room): RoomPricing => {
  // Always use the `price` column as the base and apply a 25% discount.
  // Never calculate discount from minimum_price.
  const original = room.price;
  const savings = Math.round(original * 0.25);
  const final_ = original - savings;

  return {
    finalPrice: final_,
    originalPrice: original,
    discountPercent: 25,
    savings,
    hasExplicitPricing: false,
  };
};
