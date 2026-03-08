import React from 'react';
import { Room } from '@/types/room';
import { getRoomPricing } from '@/utils/pricingUtils';

interface BookingPriceBreakdownProps {
  monthlyRent: number;
  room?: Room;
  variant?: 'default' | 'compact';
  className?: string;
}

/** @deprecated Use getRoomPricing instead for new code */
export const getDiscountAmount = (monthlyRent: number) => Math.round(monthlyRent * 0.25);
export const getFirstMonthPrice = (monthlyRent: number) => monthlyRent - getDiscountAmount(monthlyRent);
export const getConfirmationFee = getFirstMonthPrice;

/**
 * Get pricing from a Room object or fall back to legacy monthlyRent calculation.
 */
const usePricing = (room?: Room, monthlyRent?: number) => {
  if (room) {
    const p = getRoomPricing(room);
    return { finalPrice: p.finalPrice, originalPrice: p.originalPrice, savings: p.savings, discountPercent: p.discountPercent };
  }
  // Legacy fallback
  const savings = Math.round((monthlyRent || 0) * 0.25);
  return { finalPrice: (monthlyRent || 0) - savings, originalPrice: monthlyRent || 0, savings, discountPercent: 25 };
};

const BookingPriceBreakdown: React.FC<BookingPriceBreakdownProps> = ({
  monthlyRent,
  room,
  variant = 'default',
  className = '',
}) => {
  const { finalPrice, originalPrice, savings, discountPercent } = usePricing(room, monthlyRent);

  if (variant === 'compact') {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Monthly Rent</span>
          <span className="text-muted-foreground line-through">₹{originalPrice.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-green-600">First Month Discount ({discountPercent}%)</span>
          <span className="text-green-600">−₹{savings.toLocaleString()}</span>
        </div>
        <div className="border-t border-border pt-2 flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">First Month Price</span>
          <span className="text-lg font-bold text-foreground">₹{finalPrice.toLocaleString()}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-muted/40 border border-border rounded-xl p-4 space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Monthly Rent</span>
        <span className="text-sm text-muted-foreground line-through">₹{originalPrice.toLocaleString()}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-green-600">First Month Discount ({discountPercent}%)</span>
        <span className="text-sm font-medium text-green-600">−₹{savings.toLocaleString()}</span>
      </div>
      <div className="border-t border-border" />
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-foreground">First Month Payment</span>
          <p className="text-xs text-green-600 mt-0.5">You save ₹{savings.toLocaleString()}</p>
        </div>
        <span className="text-2xl font-bold text-foreground">₹{finalPrice.toLocaleString()}</span>
      </div>
    </div>
  );
};

export default BookingPriceBreakdown;
