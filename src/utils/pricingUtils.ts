import { Room, PropertyTypeFilter } from '@/types/room';

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
 * Apply PG_HOSTEL price overrides based on active property filter.
 * Returns a new Room object with price/minimum_price adjusted.
 * For non-PG_HOSTEL rooms, returns the room unchanged.
 */
export const applyPgHostelPricing = (room: Room, activeFilter?: PropertyTypeFilter): Room => {
  if (room.property_type !== 'PG_HOSTEL' || !activeFilter) return room;

  if (activeFilter === 'PG') {
    return {
      ...room,
      price: room.pg_rent ?? room.price,
      // keep minimum_price as-is
    };
  }

  if (activeFilter === 'Hostel') {
    return {
      ...room,
      price: room.hostel_rent ?? room.price,
      minimum_price: room.maximum_price ?? null,
    };
  }

  return room;
};

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
