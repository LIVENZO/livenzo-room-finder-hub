
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface RoomBasicInfoProps {
  title: string;
  setTitle: React.Dispatch<React.SetStateAction<string>>;
}

const RoomBasicInfo: React.FC<RoomBasicInfoProps> = ({ title, setTitle }) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="title" className="text-base">Room Title *</Label>
      <Input
        id="title"
        placeholder="E.g., Cozy Single Room in Downtown"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
    </div>
  );
};

export default RoomBasicInfo;
