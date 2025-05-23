
import React from 'react';
import { Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import BookRoom from '@/components/BookRoom';

interface RoomActionCardProps {
  price: number;
  roomId: string;
  ownerId: string;
  roomAvailability: string;
  handleCallOwner: () => void;
  ownerPhone: string | null;
}

const RoomActionCard: React.FC<RoomActionCardProps> = ({
  price,
  roomId,
  ownerId,
  roomAvailability,
  handleCallOwner,
  ownerPhone
}) => {
  return (
    <div className="border rounded-lg shadow-sm p-6 sticky top-24">
      <div className="flex items-center justify-between mb-4">
        <div className="text-2xl font-bold">{formatPrice(price)}<span className="text-base font-normal">/mo</span></div>
        {roomAvailability === 'available' ? (
          <Badge className="bg-green-500">Available</Badge>
        ) : (
          <Badge className="bg-yellow-500">Limited</Badge>
        )}
      </div>
      
      <div className="space-y-4">
        <BookRoom roomId={roomId} ownerId={ownerId} />
        
        <Button 
          variant="outline" 
          className="w-full flex items-center"
          onClick={handleCallOwner}
        >
          <Phone className="h-4 w-4 mr-2" /> Call Owner
          {ownerPhone && <span className="ml-1">({ownerPhone.slice(-4).padStart(ownerPhone.length, '*')})</span>}
        </Button>
      </div>
      
      <div className="mt-6 text-sm text-gray-500">
        <p>This room is managed by the owner directly.</p>
        <p className="mt-1">Security deposit: {formatPrice(price)}</p>
        <p className="mt-4">
          <strong>Note:</strong> Always verify the property and owner before making any payments.
        </p>
      </div>
    </div>
  );
};

export default RoomActionCard;
