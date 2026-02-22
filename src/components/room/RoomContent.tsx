
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import RoomReviews from '@/components/RoomReviews';
import { Room } from '@/types/room';

interface RoomContentProps {
  description: string;
  roomId: string;
  roomRules: string[];
  roomAmenities: Record<string, boolean | string | undefined>;
  room?: Room;
}

const RoomContent: React.FC<RoomContentProps> = ({
  description,
  roomId,
  roomRules,
  roomAmenities,
  room,
}) => {
  const facilityChips: { emoji: string; label: string }[] = [];

  if (room) {
    const f = room.facilities;
    facilityChips.push({
      emoji: f.roomType === 'sharing' ? '🛏️' : '🏠',
      label: f.roomType === 'single' ? 'Single' : 'Sharing',
    });
    if (f.wifi) facilityChips.push({ emoji: '📶', label: 'Wi-Fi' });
    if (f.gender === 'male') facilityChips.push({ emoji: '👦', label: 'Boys Only' });
    else if (f.gender === 'female') facilityChips.push({ emoji: '👧', label: 'Girls Only' });
    else facilityChips.push({ emoji: '👥', label: 'Any Gender' });
    if (f.bathroom) facilityChips.push({ emoji: '🚿', label: 'Connected Bathroom' });
    if (f.coolingType === 'ac') facilityChips.push({ emoji: '❄️', label: 'AC Room' });
    else if (f.coolingType === 'cooler') facilityChips.push({ emoji: '🌀', label: 'Cooler Room' });
    if (f.food === 'included') facilityChips.push({ emoji: '🍽️', label: 'Food Included' });
    else if (f.food) facilityChips.push({ emoji: '🍽️', label: 'Food Not Included' });
  }

  return (
    <Tabs defaultValue="amenities" className="mt-8">
      <TabsList>
        <TabsTrigger value="description">Description</TabsTrigger>
        <TabsTrigger value="amenities">Amenities</TabsTrigger>
        <TabsTrigger value="reviews">Reviews</TabsTrigger>
      </TabsList>
      <TabsContent value="description" className="py-4">
        <p className="text-muted-foreground whitespace-pre-line">{description}</p>
        <h3 className="font-semibold mt-6 mb-2">Room Rules</h3>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          {roomRules.map((rule, index) => (
            <li key={index}>{rule}</li>
          ))}
        </ul>
      </TabsContent>
      <TabsContent value="amenities" className="py-4">
        <div className="flex flex-wrap gap-2">
          {facilityChips.map((chip, idx) => (
            <Badge
              key={idx}
              variant="outline"
              className="text-sm px-3 py-1.5 border-primary/30 bg-primary/5 text-primary font-medium"
            >
              <span className="mr-1.5">{chip.emoji}</span>
              {chip.label}
            </Badge>
          ))}
        </div>
      </TabsContent>
      <TabsContent value="reviews" className="py-4">
        <RoomReviews roomId={roomId} />
      </TabsContent>
    </Tabs>
  );
};

export default RoomContent;
