import { Room, PropertyTypeFilter } from '@/types/room';
import { isOfferDiscountActive } from '@/hooks/useOfferStatus';

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
 */
export const applyPgHostelPricing = (room: Room, activeFilter?: PropertyTypeFilter): Room => {
  if (room.property_type !== 'PG_HOSTEL' || !activeFilter) return room;

  if (activeFilter === 'PG') {
    return {
      ...room,
      price: room.pg_rent ?? room.price,
      facilities: { ...room.facilities, food: 'not_included' as const },
    };
  }

  if (activeFilter === 'Hostel') {
    return {
      ...room,
      price: room.hostel_rent ?? room.price,
      minimum_price: room.maximum_price ?? null,
      facilities: { ...room.facilities, food: 'included' as const },
    };
  }

  return room;
};

/**
 * Centralized pricing logic for room display.
 *
 * When the offer is active (7-day or lucky 24h): 25% discount on price.
 * When the offer is expired/fully_expired: no discount, show base price.
 */
export const getRoomPricing = (room: Room): RoomPricing => {
  const discountActive = isOfferDiscountActive();

  if (!discountActive) {
    return {
      finalPrice: room.price,
      originalPrice: room.price,
      discountPercent: 0,
      savings: 0,
      hasExplicitPricing: false,
    };
  }

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
