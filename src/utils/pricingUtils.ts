import { Room, PropertyTypeFilter } from '@/types/room';
import { isOfferDiscountActive } from '@/hooks/useOfferStatus';

interface FirstMonthDiscountPricing {
  discountPercent: number;
  discountAmount: number;
  discountedPrice: number;
}

export interface RoomPricing {
  /** Permanent listed/original room price (e.g. ₹12,999) */
  basePrice: number;
  /** Permanent current room price after base room discount (e.g. ₹11,999) */
  currentRoomPrice: number;
  /** Whether base room discount exists (basePrice -> currentRoomPrice) */
  hasBaseDiscount: boolean;
  /** Time-limited 25% first month offer details; null when offer expired */
  firstMonthDiscount: FirstMonthDiscountPricing | null;

  /** @deprecated Legacy compatibility: first month payable when offer active, otherwise currentRoomPrice */
  finalPrice: number;
  /** @deprecated Legacy compatibility: currentRoomPrice while offer active, else basePrice */
  originalPrice: number;
  /** @deprecated Legacy compatibility: offer percent */
  discountPercent: number;
  /** @deprecated Legacy compatibility: offer savings */
  savings: number;
  /** Whether min/max pricing overrides are present */
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

const getCurrentRoomPrice = (room: Room): number => {
  return room.minimum_price != null ? room.minimum_price : room.price;
};

/**
 * Centralized pricing logic with two independent layers:
 * 1) Base room pricing (permanent): basePrice -> currentRoomPrice
 * 2) First-month offer pricing (time-limited): 25% off currentRoomPrice
 */
export const getRoomPricing = (room: Room): RoomPricing => {
  const basePrice = room.price;
  const currentRoomPrice = getCurrentRoomPrice(room);
  const hasBaseDiscount = currentRoomPrice !== basePrice;

  const offerActive = isOfferDiscountActive();
  const firstMonthDiscount = offerActive
    ? (() => {
        const discountAmount = Math.round(basePrice * 0.25);
        return {
          discountPercent: 25,
          discountAmount,
          discountedPrice: basePrice - discountAmount,
        };
      })()
    : null;

  return {
    basePrice,
    currentRoomPrice,
    hasBaseDiscount,
    firstMonthDiscount,

    // Backward-compatible fields
    finalPrice: firstMonthDiscount?.discountedPrice ?? currentRoomPrice,
    originalPrice: firstMonthDiscount ? currentRoomPrice : basePrice,
    discountPercent: firstMonthDiscount?.discountPercent ?? 0,
    savings: firstMonthDiscount?.discountAmount ?? 0,
    hasExplicitPricing: room.minimum_price != null || room.maximum_price != null,
  };
};
