
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Home, Users, Building } from 'lucide-react';
import { UserProfile } from '@/services/UserProfileService';

interface OwnerPropertyDisplayProps {
  profile: UserProfile;
}

const OwnerPropertyDisplay: React.FC<OwnerPropertyDisplayProps> = ({ profile }) => {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Property Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Home className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm font-medium">Accommodation Type</p>
              <Badge variant="outline">{profile.accommodation_type}</Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm font-medium">Property Name</p>
              <p className="text-sm text-gray-600">{profile.property_name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Home className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm font-medium">House Number</p>
              <p className="text-sm text-gray-600">{profile.house_number}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm font-medium">Total Rental Rooms</p>
              <p className="text-sm text-gray-600">{profile.total_rental_rooms}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm font-medium">Resident Type</p>
              <Badge variant="secondary">{profile.resident_type}</Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm font-medium">Location</p>
              <p className="text-sm text-gray-600">{profile.property_location}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OwnerPropertyDisplay;
