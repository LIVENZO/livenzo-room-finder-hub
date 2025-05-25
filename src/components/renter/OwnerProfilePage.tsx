
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  FileText, 
  MessageSquare, 
  AlertCircle, 
  CreditCard,
  MapPin,
  Home,
  Building,
  Users as UsersIcon,
  Unlink
} from 'lucide-react';
import { UserProfile } from '@/services/UserProfileService';
import { Relationship } from '@/types/relationship';
import { useNavigate } from 'react-router-dom';
import { updateRelationshipStatus } from '@/services/relationship/manageRelationships';
import { toast } from 'sonner';

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
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);

  const handleViewDocuments = () => {
    navigate(`/connections/${relationship.id}`);
  };

  const handleChatWithOwner = () => {
    navigate(`/chats/${relationship.chat_room_id}`);
  };

  const handleRaiseComplaint = () => {
    // For now, open chat - can be enhanced later with a dedicated complaint system
    navigate(`/chats/${relationship.chat_room_id}`);
  };

  const handlePayRent = () => {
    // Navigate to payment system - to be implemented
    console.log('Pay rent functionality to be implemented');
  };

  const handleDisconnectClick = () => {
    setShowDisconnectDialog(true);
  };

  const handleConfirmDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await updateRelationshipStatus(relationship.id, 'declined');
      toast.success(`You've successfully disconnected from ${owner?.full_name || 'this owner'}. You can now connect with a new property owner.`);
      setShowDisconnectDialog(false);
      onBack(); // Go back to Find Your Owner page
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast.error('Failed to disconnect. Please try again.');
    } finally {
      setIsDisconnecting(false);
    }
  };

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
        >
          <FileText className="h-6 w-6" />
          <span>View Documents</span>
        </Button>
        
        <Button 
          onClick={handleRaiseComplaint}
          variant="outline" 
          className="h-16 flex-col space-y-2"
        >
          <AlertCircle className="h-6 w-6" />
          <span>Raise a Complaint</span>
        </Button>
        
        <Button 
          onClick={handleChatWithOwner}
          variant="outline" 
          className="h-16 flex-col space-y-2"
        >
          <MessageSquare className="h-6 w-6" />
          <span>Chat with Owner</span>
        </Button>
        
        <Button 
          onClick={handlePayRent}
          className="h-16 flex-col space-y-2 bg-green-600 hover:bg-green-700"
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
            <Button 
              onClick={handleDisconnectClick}
              disabled={isDisconnecting}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Unlink className="h-4 w-4" />
              {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Disconnect Confirmation Dialog */}
      <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to disconnect from this owner?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently end your rental connection with {owner?.full_name || 'this owner'} and you will no longer have access to property details, documents, chat, or rent payments. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDisconnect}
              disabled={isDisconnecting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDisconnecting ? 'Disconnecting...' : 'Confirm Disconnect'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OwnerProfilePage;
