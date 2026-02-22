
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RoomReviews from '@/components/RoomReviews';

interface RoomContentProps {
  description: string;
  roomId: string;
  roomRules: string[];
  roomAmenities: Record<string, boolean | string | undefined>;
}

const RoomContent: React.FC<RoomContentProps> = ({
  description,
  roomId,
  roomRules,
  roomAmenities,
}) => {
  return (
    <Tabs defaultValue="amenities" className="mt-8">
      <TabsList>
        <TabsTrigger value="description">Description</TabsTrigger>
        <TabsTrigger value="amenities">Amenities</TabsTrigger>
        <TabsTrigger value="reviews">Reviews</TabsTrigger>
      </TabsList>
      <TabsContent value="description" className="py-4">
        <p className="text-gray-700 whitespace-pre-line">{description}</p>
        <h3 className="font-semibold mt-6 mb-2">Room Rules</h3>
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          {roomRules.map((rule, index) => (
            <li key={index}>{rule}</li>
          ))}
        </ul>
      </TabsContent>
      <TabsContent value="amenities" className="py-4">
        <div className="flex flex-wrap gap-2">
          {Object.entries(roomAmenities).map(([key, value]) => {
            if (!value) return null;
            
            const emojiMap: Record<string, string> = {
              wifi: '📶',
              bathroom: '🚿',
              coolingType: '❄️',
              food: '🍽️',
              gender: '👦',
              roomType: '🏠',
            };
            
            let displayText = key.replace(/([A-Z])/g, ' $1').trim();
            
            if (key === 'coolingType' && typeof value === 'string') {
              displayText = value === 'ac' ? 'AC Room' : 'Cooler Room';
            } else if (key === 'food' && typeof value === 'string') {
              displayText = value === 'included' ? 'Food Included' : 'Food Not Included';
            } else if (key === 'gender' && typeof value === 'string') {
              displayText = value === 'male' ? 'Boys Only' : value === 'female' ? 'Girls Only' : 'Any Gender';
            } else if (key === 'roomType' && typeof value === 'string') {
              displayText = value === 'single' ? 'Single' : 'Sharing';
            } else if (key === 'wifi') {
              displayText = 'Wi-Fi';
            } else if (key === 'bathroom') {
              displayText = 'Connected Bathroom';
            }
            
            const emoji = emojiMap[key] || '✅';
            
            return (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
              >
                {emoji} {displayText}
              </span>
            );
          })}
        </div>
      </TabsContent>
      <TabsContent value="reviews" className="py-4">
        <RoomReviews roomId={roomId} />
      </TabsContent>
    </Tabs>
  );
};

export default RoomContent;
