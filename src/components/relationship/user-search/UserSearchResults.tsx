
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, CheckCircle, AlertCircle, MapPin, Home, Building } from 'lucide-react';
import { UserProfile } from '@/types/relationship';

interface UserSearchResultsProps {
  foundUser: UserProfile;
  requestSent: boolean;
  requestError: string | null;
  onConnect: () => void;
  onSearchAnother: () => void;
}

const UserSearchResults: React.FC<UserSearchResultsProps> = ({
  foundUser,
  requestSent,
  requestError,
  onConnect,
  onSearchAnother
}) => {
  return (
    <Card className={`border-2 transition-all ${requestSent ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50'}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {requestSent ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-800">Connection Request Sent</span>
              </>
            ) : (
              <>
                <User className="h-5 w-5 text-blue-600" />
                <span className="text-blue-800">Owner Found</span>
              </>
            )}
          </CardTitle>
          {requestSent && (
            <Badge className="bg-green-100 text-green-800 border-green-300">
              Request Sent
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Owner Details */}
        <div className="flex items-start gap-4 p-4 bg-white rounded-lg border">
          <Avatar className="h-16 w-16 border-2 border-gray-200">
            <AvatarImage src={foundUser.avatar_url || ''} />
            <AvatarFallback className="text-lg">
              {foundUser.full_name?.charAt(0) || 'O'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="font-semibold text-lg text-gray-900">
                {foundUser.full_name || 'Property Owner'}
              </h3>
              <p className="text-sm text-gray-500 font-mono">Owner ID: {foundUser.public_id || foundUser.id.substring(0, 8)}</p>
            </div>
            
            {/* Property Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Building className="h-4 w-4 text-blue-500" />
                <span>PG/Hostel Property</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Home className="h-4 w-4 text-green-500" />
                <span>Rental Rooms Available</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <MapPin className="h-4 w-4 text-orange-500" />
                <span>Property Location</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-green-700 font-medium">Available for Connection</span>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {requestSent && (
          <div className="p-4 bg-green-100 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              <p className="font-medium">
                🎉 Request sent to {foundUser.full_name || 'owner'}. You will be notified once they accept.
              </p>
            </div>
            <p className="text-sm text-green-700 mt-2">
              Check your notifications for updates on your connection request.
            </p>
          </div>
        )}

        {/* Error Message */}
        {requestError && (
          <div className="p-4 bg-red-100 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <p className="font-medium">{requestError}</p>
            </div>
          </div>
        )}
      </CardContent>
      
      {/* Action Buttons */}
      <CardFooter className="pt-0">
        {!requestSent ? (
          <Button 
            onClick={onConnect} 
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-base font-medium"
          >
            ✅ Send Connection Request
          </Button>
        ) : (
          <Button 
            onClick={onSearchAnother}
            variant="outline"
            className="w-full h-12 text-base font-medium"
          >
            Search for Another Owner
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default UserSearchResults;
