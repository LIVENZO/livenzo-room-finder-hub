
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, Heart, HeartOff, Loader2 } from 'lucide-react';
import { Room } from '@/types/room';
import { useAuth } from '@/context/AuthContext';
import { fetchUserProfile, UserProfile } from '@/services/UserProfileService';
import LocationViewer from './LocationViewer';

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
          <Button disabled className="w-full">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Loading location...
          </Button>
        ) : (
          <LocationViewer 
            room={room}
            ownerLatitude={ownerProfile?.location_latitude ? Number(ownerProfile.location_latitude) : null}
            ownerLongitude={ownerProfile?.location_longitude ? Number(ownerProfile.location_longitude) : null}
          />
        )}
        
        {/* Call Owner Button */}
        {ownerPhone && (
          <Button 
            variant="outline" 
            className="w-full"
            onClick={onCallOwner}
          >
            <Phone className="h-4 w-4 mr-2" />
            Call Owner
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoomActionCard;
