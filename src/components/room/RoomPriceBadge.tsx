
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { Room } from '@/types/room';
import { getRoomPricing } from '@/utils/pricingUtils';

interface RoomPriceBadgeProps {
  price: number;
  room?: Room;
}

const RoomPriceBadge: React.FC<RoomPriceBadgeProps> = ({ price, room }) => {
  if (room) {
    const pricing = getRoomPricing(room);
    return (
      <div className="flex items-center gap-1.5">
        <Badge className="bg-primary font-semibold">{formatPrice(pricing.currentRoomPrice)}</Badge>
        {pricing.hasBaseDiscount && (
          <span className="text-xs text-muted-foreground line-through">{formatPrice(pricing.basePrice)}</span>
        )}
      </div>
    );
  }
  return (
    <Badge className="bg-primary">{formatPrice(price)}</Badge>
  );
};

export default RoomPriceBadge;
