import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Search, MapPin, Home, AlertTriangle } from 'lucide-react';
import { Relationship } from '@/types/relationship';
import UserSearch from '@/components/relationship/UserSearch';

interface FindYourOwnerProps {
  currentUserId: string;
  renterRelationships: Relationship[];
  onOwnerSelect: (relationship: Relationship) => void;
  onRefresh?: () => void;
}

const FindYourOwner: React.FC<FindYourOwnerProps> = ({
  currentUserId,
  renterRelationships,
  onOwnerSelect,
  onRefresh,
}) => {
  const activeConnection = renterRelationships.find(r => r.status === 'accepted');
  const pendingConnections = renterRelationships.filter(r => r.status === 'pending');
  const declinedConnections = renterRelationships.filter(r => r.status === 'declined');

  // Refresh data when component mounts if there are declined connections
  React.useEffect(() => {
    if (onRefresh && declinedConnections.length > 0) {
      // Only refresh if we detect a recently declined connection
      onRefresh();
    }
  }, [onRefresh, declinedConnections.length]);

  // If user has active connection, redirect directly to post-connection interface
  React.useEffect(() => {
    if (activeConnection) {
      onOwnerSelect(activeConnection);
    }
  }, [activeConnection, onOwnerSelect]);

  // If we have an active connection, don't render anything as we're redirecting
  if (activeConnection) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Search className="h-8 w-8 text-blue-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900">
          {declinedConnections.length > 0 ? "Connect with a New Owner" : "Find Your Owner"}
        </h1>
        <p className="text-lg text-gray-600 max-w-md mx-auto">
          {declinedConnections.length > 0 
            ? "You've successfully disconnected from your previous owner. Enter the new owner's ID to connect again."
            : "Search for your PG/Hostel owner using their unique 10-character Owner ID"
          }
        </p>
        
        {declinedConnections.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-green-700">
              ✨ Ready to connect with a new owner? Search below using their unique Owner ID.
            </p>
          </div>
        )}
      </div>

      {/* Search Section */}
      <Card className="border-2 border-blue-100">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-600" />
            Search by Owner ID
          </CardTitle>
          <p className="text-sm text-gray-600">
            Enter the 10-character Owner ID provided by your property owner (e.g., "a9x8b7c2qk") to send a connection request.
          </p>
        </CardHeader>
        <CardContent>
          <UserSearch currentUserId={currentUserId} />
        </CardContent>
      </Card>

      {/* Pending Connections */}
      {pendingConnections.length > 0 && (
        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <Users className="h-5 w-5" />
              Pending Connection Requests
            </CardTitle>
            <p className="text-sm text-amber-700">
              Your connection requests are being reviewed
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingConnections.map((relationship) => (
                <div 
                  key={relationship.id}
                  className="flex items-center justify-between p-4 border border-amber-200 rounded-lg bg-amber-50"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="border-2 border-amber-200">
                      <AvatarImage src={relationship.owner?.avatar_url || ''} />
                      <AvatarFallback className="bg-amber-100 text-amber-800">
                        {relationship.owner?.full_name?.charAt(0) || 'O'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <p className="font-medium text-gray-900">
                        {relationship.owner?.full_name || 'Owner'}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <Home className="h-3 w-3" />
                        <span>PG/Hostel Property</span>
                      </div>
                      <p className="text-sm text-amber-700 mt-1">
                        Connection request sent
                      </p>
                    </div>
                  </div>
                  
                  <Badge variant="outline" className="border-amber-400 text-amber-700 bg-amber-50">
                    Pending Review
                  </Badge>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700 flex items-center gap-2">
                <Users className="h-4 w-4" />
                You will be notified once the owner accepts your request
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="pt-6">
          <div className="text-center space-y-3">
            <h3 className="font-semibold text-gray-900">Need Help?</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Ask your property owner for their 10-character Owner ID</p>
              <p>• The Owner ID looks like "a9x8b7c2qk" (10 characters with letters and numbers)</p>
              <p>• Contact your owner if you're having trouble connecting</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FindYourOwner;
