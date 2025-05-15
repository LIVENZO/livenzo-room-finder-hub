
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface RoomPriceLocationProps {
  price: string;
  setPrice: React.Dispatch<React.SetStateAction<string>>;
  location: string;
  setLocation: React.Dispatch<React.SetStateAction<string>>;
}

const RoomPriceLocation: React.FC<RoomPriceLocationProps> = ({ 
  price, 
  setPrice, 
  location, 
  setLocation 
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="price" className="text-base">Monthly Rent (₹) *</Label>
        <Input
          id="price"
          type="number"
          min="0"
          placeholder="Enter monthly rent"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="location" className="text-base">Location *</Label>
        <Input
          id="location"
          placeholder="City, State"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
        />
      </div>
    </div>
  );
};

export default RoomPriceLocation;
