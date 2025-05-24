
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Search } from 'lucide-react';
import { Relationship } from '@/types/relationship';
import UserSearch from '@/components/relationship/UserSearch';

interface FindYourOwnerProps {
  currentUserId: string;
  renterRelationships: Relationship[];
  onOwnerSelect: (relationship: Relationship) => void;
}

const FindYourOwner: React.FC<FindYourOwnerProps> = ({
  currentUserId,
  renterRelationships,
  onOwnerSelect,
}) => {
  const activeConnection = renterRelationships.find(r => r.status === 'accepted');
  const pendingConnections = renterRelationships.filter(r => r.status === 'pending');

  if (activeConnection) {
    return (
      <div className="max-w-md mx-auto">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Your Property Owner</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="flex flex-col items-center space-y-4"
              onClick={() => onOwnerSelect(activeConnection)}
            >
              <Avatar className="h-20 w-20">
                <AvatarImage src={activeConnection.owner?.avatar_url || ''} />
                <AvatarFallback className="text-xl">
                  {activeConnection.owner?.full_name?.charAt(0) || 'O'}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h3 className="font-semibold text-lg">
                  {activeConnection.owner?.full_name || 'Owner'}
                </h3>
                <Badge variant="secondary" className="mt-1">Connected</Badge>
              </div>
              <Button className="w-full">
                <Users className="h-4 w-4 mr-2" />
                View Owner Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Search for Owner */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Find Your Property Owner</h2>
        <p className="text-gray-600">
          Connect with your property owner to manage your rental relationship
        </p>
      </div>

      <UserSearch currentUserId={currentUserId} />

      {/* Pending Connections */}
      {pendingConnections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Pending Connection Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingConnections.map((relationship) => (
                <div 
                  key={relationship.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={relationship.owner?.avatar_url || ''} />
                      <AvatarFallback>
                        {relationship.owner?.full_name?.charAt(0) || 'O'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {relationship.owner?.full_name || 'Owner'}
                      </p>
                      <p className="text-sm text-gray-500">Connection requested</p>
                    </div>
                  </div>
                  <Badge variant="outline">Pending</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FindYourOwner;
