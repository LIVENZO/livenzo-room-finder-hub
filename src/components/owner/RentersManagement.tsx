
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Users, FileText, MessageSquare, DollarSign } from 'lucide-react';
import { Relationship } from '@/types/relationship';
import RenterDetailPanel from './RenterDetailPanel';

interface RentersManagementProps {
  currentUserId: string;
  ownerRelationships: Relationship[];
  isLoading: boolean;
  onRefresh: () => void;
}

const RentersManagement: React.FC<RentersManagementProps> = ({
  currentUserId,
  ownerRelationships,
  isLoading,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRenter, setSelectedRenter] = useState<Relationship | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'room' | 'status'>('name');

  const activeRenters = ownerRelationships.filter(r => r.status === 'accepted');
  
  // Filter and sort renters based on search term and sort option
  const filteredRenters = activeRenters
    .filter(renter => {
      const renterName = renter.renter?.full_name?.toLowerCase() || '';
      return renterName.includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.renter?.full_name || '').localeCompare(b.renter?.full_name || '');
        case 'room':
          // For now, we'll sort by created date as room number isn't available
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

  const handleRenterSelect = (renter: Relationship) => {
    setSelectedRenter(renter);
  };

  const handleBackToList = () => {
    setSelectedRenter(null);
    onRefresh(); // Refresh data when going back
  };

  if (selectedRenter) {
    return (
      <RenterDetailPanel
        relationship={selectedRenter}
        onBack={handleBackToList}
        onRefresh={onRefresh}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="text-center p-8">
        <p className="text-lg">Loading renters...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Manage Renters ({activeRenters.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by renter name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={sortBy === 'name' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('name')}
              >
                Name
              </Button>
              <Button
                variant={sortBy === 'room' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('room')}
              >
                Room
              </Button>
              <Button
                variant={sortBy === 'status' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('status')}
              >
                Status
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Renters List */}
      {filteredRenters.length === 0 ? (
        <Card>
          <CardContent className="text-center p-8">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">No Active Renters</h3>
            <p className="text-gray-500">
              {searchTerm ? 'No renters match your search criteria.' : 'You have no active renters at the moment.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRenters.map((renter) => (
            <Card 
              key={renter.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleRenterSelect(renter)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={renter.renter?.avatar_url || ''} />
                      <AvatarFallback>
                        {renter.renter?.full_name?.charAt(0) || 'R'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {renter.renter?.full_name || 'Unknown Renter'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Connected on {new Date(renter.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Room</p>
                      <p className="font-medium">--</p>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <DollarSign className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default RentersManagement;
