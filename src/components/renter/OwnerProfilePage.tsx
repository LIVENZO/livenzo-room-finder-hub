
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  MessageSquare, 
  AlertCircle, 
  CreditCard,
  MapPin,
  Home,
  Building,
  Users as UsersIcon
} from 'lucide-react';
import { UserProfile } from '@/services/UserProfileService';
import { Relationship } from '@/types/relationship';
import { useNavigate } from 'react-router-dom';
import RenterDisconnectButton from './RenterDisconnectButton';

interface OwnerProfilePageProps {
  relationship: Relationship;
  onBack: () => void;
}

const OwnerProfilePage: React.FC<OwnerProfilePageProps> = ({
  relationship,
  onBack,
}) => {
  const navigate = useNavigate();
  const owner = relationship.owner;
  const [isDisconnected, setIsDisconnected] = useState(false);

  const handleViewDocuments = () => {
    if (isDisconnected) return;
    navigate(`/connections/${relationship.id}`);
  };

  const handleChatWithOwner = () => {
    if (isDisconnected) return;
    navigate(`/chats/${relationship.chat_room_id}`);
  };

  const handleRaiseComplaint = () => {
    if (isDisconnected) return;
    // For now, open chat - can be enhanced later with a dedicated complaint system
    navigate(`/chats/${relationship.chat_room_id}`);
  };

  const handlePayRent = () => {
    if (isDisconnected) return;
    // Navigate to payment system - to be implemented
    console.log('Pay rent functionality to be implemented');
  };

  const handleDisconnect = () => {
    setIsDisconnected(true);
    // Navigate back after a short delay to show the success message
    setTimeout(() => {
      onBack();
    }, 1500);
  };

  // If disconnected, show a simplified view
  if (isDisconnected) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button 
            onClick={onBack}
            className="text-blue-600 hover:underline mb-4"
          >
            ← Back to Find Your Owner
          </button>
          <h1 className="text-3xl font-bold">Connection Ended</h1>
          <p className="text-gray-600">You have successfully disconnected from your property owner</p>
        </div>

        <Card className="mb-6 border-gray-200 bg-gray-50">
          <CardContent className="p-6 text-center">
            <div className="mb-4">
              <Home className="h-12 w-12 mx-auto text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              Connection Ended
            </h3>
            <p className="text-gray-600">
              Your rental connection with {owner?.full_name || 'this owner'} has been terminated.
              You can reconnect with the same owner or find a new property owner.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <button 
          onClick={onBack}
          className="text-blue-600 hover:underline mb-4"
        >
          ← Back to Find Your Owner
        </button>
        <h1 className="text-3xl font-bold">Your Property Owner</h1>
        <p className="text-gray-600">Manage your rental relationship and communications</p>
      </div>

      {/* Owner Profile Card */}
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

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Button 
          onClick={handleViewDocuments}
          variant="outline" 
          className="h-16 flex-col space-y-2"
          disabled={isDisconnected}
        >
          <FileText className="h-6 w-6" />
          <span>View Documents</span>
        </Button>
        
        <Button 
          onClick={handleRaiseComplaint}
          variant="outline" 
          className="h-16 flex-col space-y-2"
          disabled={isDisconnected}
        >
          <AlertCircle className="h-6 w-6" />
          <span>Raise a Complaint</span>
        </Button>
        
        <Button 
          onClick={handleChatWithOwner}
          variant="outline" 
          className="h-16 flex-col space-y-2"
          disabled={isDisconnected}
        >
          <MessageSquare className="h-6 w-6" />
          <span>Chat with Owner</span>
        </Button>
        
        <Button 
          onClick={handlePayRent}
          className="h-16 flex-col space-y-2 bg-green-600 hover:bg-green-700"
          disabled={isDisconnected}
        >
          <CreditCard className="h-6 w-6" />
          <span>Pay Rent</span>
        </Button>
      </div>

      {/* Disconnect Button */}
      <Card className="border-red-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-red-800">Disconnect from Owner</h3>
              <p className="text-sm text-red-600">
                End your rental relationship with this owner
              </p>
            </div>
            <RenterDisconnectButton
              relationship={relationship}
              onDisconnect={handleDisconnect}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OwnerProfilePage;
