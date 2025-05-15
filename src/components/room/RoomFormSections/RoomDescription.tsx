
import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface RoomDescriptionProps {
  description: string;
  setDescription: React.Dispatch<React.SetStateAction<string>>;
}

const RoomDescription: React.FC<RoomDescriptionProps> = ({ description, setDescription }) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="description" className="text-base">Description *</Label>
      <Textarea
        id="description"
        placeholder="Describe your room in detail (amenities, surroundings, rules, etc.)"
        rows={5}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
      />
    </div>
  );
};

export default RoomDescription;
