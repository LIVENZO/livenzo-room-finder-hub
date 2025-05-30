
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Building, Home, MapPin } from 'lucide-react';
import { Relationship } from '@/types/relationship';

interface OwnerProfileHeaderProps {
  relationship: Relationship;
}

const OwnerProfileHeader: React.FC<OwnerProfileHeaderProps> = ({ relationship }) => {
  const owner = relationship.owner;

  return (
    <Card className="mb-6">
      <CardHeader className="text-center">
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={owner?.avatar_url || ''} />
            <AvatarFallback className="text-2xl">
              {owner?.full_name?.charAt(0) || 'O'}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-2xl">{owner?.full_name || 'Owner'}</CardTitle>
            <Badge variant="secondary" className="mt-2">Property Owner</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Building className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-500">Property Type</p>
                <p className="font-medium">PG/Hostel</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Home className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-500">House Name</p>
                <p className="font-medium">Property Name</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Home className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-500">House Number</p>
                <p className="font-medium">House #123</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-500">Location</p>
                <p className="font-medium">Property Location</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OwnerProfileHeader;
