
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface RoomContactProps {
  phone: string;
  setPhone: React.Dispatch<React.SetStateAction<string>>;
}

const RoomContact: React.FC<RoomContactProps> = ({ phone, setPhone }) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="phone" className="text-base">Contact Phone Number *</Label>
      <Input
        id="phone"
        placeholder="Your phone number for inquiries"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        required
      />
    </div>
  );
};

export default RoomContact;
