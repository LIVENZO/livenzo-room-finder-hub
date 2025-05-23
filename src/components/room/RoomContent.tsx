
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RoomReviews from '@/components/RoomReviews';

interface RoomContentProps {
  description: string;
  roomId: string;
  roomRules: string[];
  roomAmenities: Record<string, boolean>;
}

const RoomContent: React.FC<RoomContentProps> = ({
  description,
  roomId,
  roomRules,
  roomAmenities
}) => {
  return (
    <Tabs defaultValue="description" className="mt-8">
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
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(roomAmenities).map(([key, value]) => (
            value && (
              <div key={key} className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-primary mr-2" />
                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              </div>
            )
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
