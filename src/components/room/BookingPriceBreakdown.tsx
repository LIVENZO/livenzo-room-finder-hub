import React from 'react';

interface BookingPriceBreakdownProps {
  monthlyRent: number;
  variant?: 'default' | 'compact';
  className?: string;
}

const BookingPriceBreakdown: React.FC<BookingPriceBreakdownProps> = ({
  monthlyRent,
  variant = 'default',
  className = '',
}) => {
  const confirmationFee = Math.round(monthlyRent * 0.25);

  if (variant === 'compact') {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Monthly Rent</span>
          <span className="text-foreground">₹{monthlyRent.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Booking Fee (25%)</span>
          <span className="text-lg font-bold text-foreground">₹{confirmationFee.toLocaleString()}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-muted/40 border border-border rounded-xl p-4 space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Monthly Rent</span>
        <span className="text-sm font-medium text-foreground">₹{monthlyRent.toLocaleString()}</span>
      </div>
      <div className="border-t border-border" />
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-foreground">Booking Confirmation Fee</span>
          <p className="text-xs text-muted-foreground mt-0.5">25% of first month rent</p>
        </div>
        <span className="text-2xl font-bold text-foreground">₹{confirmationFee.toLocaleString()}</span>
      </div>
    </div>
  );
};

export default BookingPriceBreakdown;

export const getConfirmationFee = (monthlyRent: number) => Math.round(monthlyRent * 0.25);
