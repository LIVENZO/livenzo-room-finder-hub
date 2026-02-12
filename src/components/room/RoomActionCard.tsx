import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarCheck, Calendar } from 'lucide-react';
import { Room } from '@/types/room';
import { useAuth } from '@/context/AuthContext';
import LocationViewer from './LocationViewer';
import { toast } from 'sonner';
import BookingFlowSheet from './BookingFlowSheet';

interface RoomActionCardProps {
  room: Room;
  ownerPhone: string | null;
  onCallOwner: () => void;
}

const RoomActionCard: React.FC<RoomActionCardProps> = ({
  room,
  ownerPhone,
  onCallOwner,
}) => {
  const { user } = useAuth();
  const [bookingSheetOpen, setBookingSheetOpen] = useState(false);
  
  // Check if current user is the owner
  const isOwner = user?.id === room.ownerId;

  const handleBookNow = () => {
    if (!user) {
      toast.error('Please login to book a room');
      return;
    }
    setBookingSheetOpen(true);
  };

  return (
    <>
      <Card className="sticky top-6">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            ₹{room.price.toLocaleString()}
            <span className="text-base font-normal text-muted-foreground">/month</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Availability Badge */}
          <Badge 
            variant={room.available ? "default" : "secondary"} 
            className={room.available ? "bg-green-100 text-green-800" : ""}
          >
            {room.available ? "Available" : "Not Available"}
          </Badge>
          
          {/* Location Viewer - uses room.latitude/longitude which includes fallback */}
          <LocationViewer room={room} />
          
          {/* Chat Support & Call Owner Buttons - Hidden for property owner */}
          {!isOwner && (
            <div className="flex gap-2 w-full">
              {/* WhatsApp Chat Support Button */}
              <Button 
                className="flex-1 bg-[#25D366] hover:bg-[#1da851] text-white"
                onClick={() => {
                  const facilities = room.facilities || {};
                  const roomType = facilities.roomType === 'single' ? 'Single' : facilities.roomType === 'sharing' ? 'Sharing' : 'Room';
                  const gender = facilities.gender === 'male' ? 'Boys' : facilities.gender === 'female' ? 'Girls' : 'Any';
                  const message = `Hi Livenzo,

I'm interested in the ${room.title}

₹${room.price.toLocaleString()} | ${roomType} room | ${gender}

${room.house_name || ''}, ${room.location}

Room ID: ${room.id}

Please help me.`;
                  const encodedMessage = encodeURIComponent(message);
                  const whatsappUrl = `https://wa.me/917488698970?text=${encodedMessage}`;
                  window.open(whatsappUrl, '_blank');
                }}
              >
                💬 Chat Support
              </Button>
              
              {/* Call Button */}
              <Button 
                variant="outline" 
                className="flex-1 border-primary/30 hover:bg-primary/5 hover:border-primary/50"
                onClick={onCallOwner}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Call
              </Button>
            </div>
          )}
          
          {/* Book & Pay After Shift Button - Primary CTA, Hidden for property owner */}
          {!isOwner && (
            <Button 
              className="w-full"
              onClick={handleBookNow}
            >
              <CalendarCheck className="h-4 w-4 mr-2" />
              Book & Pay After Shift
            </Button>
          )}
          
          {/* Property Details */}
          <div className="space-y-2 pt-4 border-t">
            <h4 className="font-semibold">Property Details</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>📍 {room.location}</p>
              {room.facilities.wifi && <p>📶 WiFi Available</p>}
              {room.facilities.bathroom && <p>🚿 Private Bathroom</p>}
              {room.facilities.gender && (
                <p>👥 {room.facilities.gender === 'any' ? 'Co-ed' : room.facilities.gender === 'male' ? 'Boys Only' : 'Girls Only'}</p>
              )}
              {room.facilities.roomType && (
                <p>🛏️ {room.facilities.roomType === 'single' ? 'Single Occupancy' : 'Shared Room'}</p>
              )}
              {room.facilities.coolingType && (
                <p>❄️ {room.facilities.coolingType === 'ac' ? 'AC Room' : 'Cooler Room'}</p>
              )}
              {room.facilities.food && (
                <p>🍽️ {room.facilities.food === 'included' ? 'Food Included' : 'Food Not Included'}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking Flow Sheet */}
      {user && (
        <BookingFlowSheet
          open={bookingSheetOpen}
          onOpenChange={setBookingSheetOpen}
          roomId={room.id}
          userId={user.id}
          roomTitle={room.title}
          roomPrice={room.price}
          userName={user.user_metadata?.full_name || user.user_metadata?.name || ''}
          userPhone={user.phone || user.user_metadata?.phone || ''}
          userEmail={user.email || ''}
        />
      )}
    </>
  );
};

export default RoomActionCard;
