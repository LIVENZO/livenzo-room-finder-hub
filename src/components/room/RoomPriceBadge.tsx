
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';

interface RoomPriceBadgeProps {
  price: number;
}

const RoomPriceBadge: React.FC<RoomPriceBadgeProps> = ({ price }) => {
  return (
    <Badge className="bg-primary">{formatPrice(price)}/mo</Badge>
  );
};

export default RoomPriceBadge;
