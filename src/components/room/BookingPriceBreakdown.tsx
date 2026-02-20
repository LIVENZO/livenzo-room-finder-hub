import React from 'react';

interface BookingPriceBreakdownProps {
  monthlyRent: number;
  variant?: 'default' | 'compact';
  className?: string;
}

export const getDiscountAmount = (monthlyRent: number) => Math.round(monthlyRent * 0.25);
export const getFirstMonthPrice = (monthlyRent: number) => monthlyRent - getDiscountAmount(monthlyRent);

// Keep old export name for backward compat but map to new logic
export const getConfirmationFee = getFirstMonthPrice;

const BookingPriceBreakdown: React.FC<BookingPriceBreakdownProps> = ({
  monthlyRent,
  variant = 'default',
  className = '',
}) => {
  const discountAmount = getDiscountAmount(monthlyRent);
  const finalPrice = getFirstMonthPrice(monthlyRent);

  if (variant === 'compact') {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Monthly Rent</span>
          <span className="text-muted-foreground line-through">₹{monthlyRent.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-green-600">First Month Discount (25%)</span>
          <span className="text-green-600">−₹{discountAmount.toLocaleString()}</span>
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
        <span className="text-sm text-muted-foreground line-through">₹{monthlyRent.toLocaleString()}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-green-600">First Month Discount (25%)</span>
        <span className="text-sm font-medium text-green-600">−₹{discountAmount.toLocaleString()}</span>
      </div>
      <div className="border-t border-border" />
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-foreground">First Month Payment</span>
          <p className="text-xs text-green-600 mt-0.5">You save ₹{discountAmount.toLocaleString()}</p>
        </div>
        <span className="text-2xl font-bold text-foreground">₹{finalPrice.toLocaleString()}</span>
      </div>
    </div>
  );
};

export default BookingPriceBreakdown;
