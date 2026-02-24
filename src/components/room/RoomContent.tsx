
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RoomReviews from '@/components/RoomReviews';
import { Room } from '@/types/room';

interface RoomContentProps {
  description: string;
  roomId: string;
  roomRules: string[];
  roomAmenities: Record<string, boolean | string | undefined>;
  room?: Room;
}

interface AmenityRow {
  emoji: string;
  label: string;
  available: boolean;
}

const RoomContent: React.FC<RoomContentProps> = ({
  description,
  roomId,
  roomRules,
  roomAmenities,
  room,
}) => {
  const amenities: AmenityRow[] = [];

  if (room) {
    const f = room.facilities;

    // Room type
    amenities.push({
      emoji: f.roomType === 'sharing' ? '🛏️' : '🏠',
      label: f.roomType === 'single' ? 'Single Room' : 'Sharing Room',
      available: true,
    });

    // Gender
    if (f.gender === 'male') amenities.push({ emoji: '👦', label: 'Boys Only', available: true });
    else if (f.gender === 'female') amenities.push({ emoji: '👧', label: 'Girls Only', available: true });
    else amenities.push({ emoji: '👥', label: 'Any Gender', available: true });

    // Cooling
    if (f.coolingType === 'ac') amenities.push({ emoji: '❄️', label: 'AC Room', available: true });
    else if (f.coolingType === 'cooler') amenities.push({ emoji: '🌀', label: 'Cooler Room', available: true });

    // Food
    amenities.push({
      emoji: '🍽️',
      label: f.food === 'included' ? 'Food Included' : 'Food Not Included',
      available: f.food === 'included',
    });

    // Wi-Fi
    amenities.push({
      emoji: '📶',
      label: f.wifi ? 'Wi-Fi Available' : 'No Wi-Fi',
      available: !!f.wifi,
    });

    // Bathroom
    amenities.push({
      emoji: '🚿',
      label: f.bathroom ? 'Attached Bathroom' : 'No Attached Bathroom',
      available: !!f.bathroom,
    });

    // Laundry
    amenities.push({
      emoji: '🧺',
      label: f.laundry ? 'Laundry Included' : 'Laundry Not Included',
      available: !!f.laundry,
    });

    // Electric bill
    amenities.push({
      emoji: '⚡',
      label: f.electricBill ? 'Electricity Bill Included' : 'Electricity Bill Not Included',
      available: !!f.electricBill,
    });
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
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden divide-y divide-border/40">
          {amenities.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 px-4 py-3.5"
            >
              <span className="text-xl leading-none">{item.emoji}</span>
              {!item.available && <span className="text-sm leading-none opacity-60">❌</span>}
              <span
                className={
                  item.available
                    ? 'text-sm font-medium text-foreground'
                    : 'text-sm font-medium text-muted-foreground/70'
                }
              >
                {item.label}
              </span>
            </div>
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
