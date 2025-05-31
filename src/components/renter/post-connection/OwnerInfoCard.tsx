
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Home, MapPin, Phone } from 'lucide-react';
import { Relationship } from '@/types/relationship';
import { UserProfile } from '@/services/UserProfileService';

interface OwnerInfoCardProps {
  relationship: Relationship;
  ownerProfile: UserProfile | null;
  profileLoading: boolean;
}

const OwnerInfoCard: React.FC<OwnerInfoCardProps> = ({
  relationship,
  ownerProfile,
  profileLoading
}) => {
  const owner = relationship.owner;

  return (
    <Card className="bg-blue-50 border-blue-100 shadow-lg rounded-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 ring-4 ring-white shadow-md">
            <AvatarImage src={owner?.avatar_url || ''} />
            <AvatarFallback className="bg-blue-100">
              <Home className="h-8 w-8 text-blue-600" />
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              {owner?.full_name || 'Property Owner'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-3 rounded-lg shadow-sm border border-blue-100">
                <div className="flex items-center gap-2 mb-1">
                  <Home className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-600">PG/Hostel Name</span>
                </div>
                <div className="text-base font-bold text-slate-900">
                  {profileLoading ? (
                    <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                  ) : (
                    ownerProfile?.property_name || 'Not specified'
                  )}
                </div>
              </div>
              
              <div className="bg-white p-3 rounded-lg shadow-sm border border-blue-100">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-600">House Number</span>
                </div>
                <div className="text-base font-bold text-slate-900">
                  {profileLoading ? (
                    <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                  ) : (
                    ownerProfile?.house_number || 'Not specified'
                  )}
                </div>
              </div>
              
              <div className="bg-white p-3 rounded-lg shadow-sm border border-blue-100">
                <div className="flex items-center gap-2 mb-1">
                  <Phone className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-600">Contact Number</span>
                </div>
                <div className="text-base font-bold text-emerald-600">
                  {profileLoading ? (
                    <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                  ) : (
                    ownerProfile?.phone || 'Not specified'
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <Badge variant="default" className="bg-emerald-100 text-emerald-800 border-emerald-200 px-3 py-1 font-semibold shadow-sm">
            Connected
          </Badge>
        </div>
      </CardHeader>
    </Card>
  );
};

export default OwnerInfoCard;
