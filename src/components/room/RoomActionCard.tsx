
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Loader2, Calendar } from 'lucide-react';
import { Room } from '@/types/room';
import { useAuth } from '@/context/AuthContext';
import { fetchUserProfile, UserProfile } from '@/services/UserProfileService';
import LocationViewer from './LocationViewer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const [ownerProfile, setOwnerProfile] = useState<UserProfile | null>(null);
  const [loadingOwnerProfile, setLoadingOwnerProfile] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  
  // Check if current user is the owner
  const isOwner = user?.id === room.ownerId;

  // Fetch owner profile to get location data
  useEffect(() => {
    const loadOwnerProfile = async () => {
      if (room.ownerId) {
        setLoadingOwnerProfile(true);
        const profile = await fetchUserProfile(room.ownerId);
        setOwnerProfile(profile);
        setLoadingOwnerProfile(false);
      }
    };

    loadOwnerProfile();
  }, [room.ownerId]);

  const handleBookNow = async () => {
    if (!user) {
      toast.error('Please login to book a room');
      return;
    }

    setBookingLoading(true);
    try {
      const { error } = await supabase
        .from('booking_requests')
        .insert({
          room_id: room.id,
          user_id: user.id,
          status: 'pending'
        });

      if (error) throw error;
      toast.success('Booking request sent successfully! Waiting for admin approval.');
    } catch (error) {
      console.error('Error submitting booking request:', error);
      toast.error('Failed to submit booking request');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          ₹{room.price.toLocaleString()}
          <span className="text-base font-normal text-gray-600">/month</span>
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
        
        {/* Location Viewer */}
        {loadingOwnerProfile ? (
          <div className="w-full h-12 bg-gray-100 rounded animate-pulse flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="ml-2 text-sm text-gray-500">Loading location...</span>
          </div>
        ) : (
          <LocationViewer 
            room={room}
            ownerLatitude={ownerProfile?.location_latitude ? Number(ownerProfile.location_latitude) : null}
            ownerLongitude={ownerProfile?.location_longitude ? Number(ownerProfile.location_longitude) : null}
          />
        )}
        
        {/* Call Owner Button - Hidden for property owner */}
        {!isOwner && ownerPhone && (
          <Button 
            variant="outline" 
            className="w-full"
            onClick={onCallOwner}
          >
            <Phone className="h-4 w-4 mr-2" />
            Call Owner
          </Button>
        )}
        
        {/* Book Now Button - Hidden for property owner */}
        {!isOwner && (
          <Button 
            className="w-full"
            onClick={handleBookNow}
            disabled={bookingLoading}
          >
            {bookingLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Booking...
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4 mr-2" />
                Book Now
              </>
            )}
          </Button>
        )}
        
        {/* Property Details */}
        <div className="space-y-2 pt-4 border-t">
          <h4 className="font-semibold">Property Details</h4>
          <div className="text-sm text-gray-600 space-y-1">
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
  );
};

export default RoomActionCard;
