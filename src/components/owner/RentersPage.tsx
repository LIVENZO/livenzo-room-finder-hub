
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  MessageSquare, 
  FileText, 
  AlertTriangle,
  UserMinus,
  CheckCircle,
  XCircle,
  DollarSign
} from 'lucide-react';
import { fetchOwnerRelationships, updateRelationshipStatus } from '@/services/relationship';
import { Relationship } from '@/types/relationship';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import RenterDetailPanel from './RenterDetailPanel';

interface RentersPageProps {
  currentUserId: string;
}

const RentersPage: React.FC<RentersPageProps> = ({ currentUserId }) => {
  const navigate = useNavigate();
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const [selectedRelationship, setSelectedRelationship] = useState<Relationship | null>(null);

  const loadRelationships = async () => {
    setLoading(true);
    try {
      const data = await fetchOwnerRelationships(currentUserId);
      setRelationships(data);
    } catch (error) {
      console.error('Error loading relationships:', error);
      toast.error('Failed to load renter requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRelationships();
  }, [currentUserId]);

  const handleAccept = async (relationshipId: string) => {
    setProcessingIds(prev => [...prev, relationshipId]);
    try {
      await updateRelationshipStatus(relationshipId, 'accepted');
      await loadRelationships();
      toast.success('Connection request accepted');
    } catch (error) {
      toast.error('Failed to accept request');
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== relationshipId));
    }
  };

  const handleDecline = async (relationshipId: string) => {
    setProcessingIds(prev => [...prev, relationshipId]);
    try {
      await updateRelationshipStatus(relationshipId, 'declined');
      await loadRelationships();
      toast.success('Connection request declined');
    } catch (error) {
      toast.error('Failed to decline request');
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== relationshipId));
    }
  };

  const handleDisconnect = async (relationshipId: string) => {
    if (!window.confirm('Are you sure you want to disconnect this renter?')) {
      return;
    }
    
    setProcessingIds(prev => [...prev, relationshipId]);
    try {
      await updateRelationshipStatus(relationshipId, 'declined');
      await loadRelationships();
      toast.success('Renter disconnected');
    } catch (error) {
      toast.error('Failed to disconnect renter');
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== relationshipId));
    }
  };

  const handleDocuments = (relationship: Relationship) => {
    setSelectedRelationship(relationship);
  };

  const handleChat = (relationship: Relationship) => {
    navigate(`/chats/${relationship.chat_room_id}`);
  };

  const handleComplaints = (relationship: Relationship) => {
    // For now, navigate to chat - can be enhanced with dedicated complaint view
    navigate(`/chats/${relationship.chat_room_id}`);
  };

  const handlePayments = (relationship: Relationship) => {
    // Navigate to payments view - to be implemented
    console.log('Navigate to payments for relationship:', relationship.id);
    toast.info('Payment management feature coming soon');
  };

  const handleBackToList = () => {
    setSelectedRelationship(null);
    loadRelationships(); // Refresh the list
  };

  // If a renter is selected, show the detail panel
  if (selectedRelationship) {
    return (
      <RenterDetailPanel
        relationship={selectedRelationship}
        onBack={handleBackToList}
        onRefresh={loadRelationships}
      />
    );
  }

  const pendingRequests = relationships.filter(r => r.status === 'pending');
  const connectedRenters = relationships.filter(r => r.status === 'accepted');

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center">
          <p className="text-lg">Loading renters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Renters</h1>
        <p className="text-gray-600">Manage connection requests and connected renters</p>
      </div>

      <Tabs defaultValue="requests" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="requests" className="flex items-center gap-2">
            Requests
            {pendingRequests.length > 0 && (
              <Badge variant="destructive">{pendingRequests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="connected" className="flex items-center gap-2">
            Connected
            {connectedRenters.length > 0 && (
              <Badge variant="secondary">{connectedRenters.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Pending Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No pending requests</h3>
                <p className="text-gray-600">New connection requests will appear here</p>
              </CardContent>
            </Card>
          ) : (
            pendingRequests.map((relationship) => (
              <Card key={relationship.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={relationship.renter?.avatar_url || ''} />
                        <AvatarFallback>
                          <User className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <h3 className="font-semibold text-lg">
                          {relationship.renter?.full_name || 'Renter'}
                        </h3>
                        <p className="text-sm text-gray-500 mb-2">
                          Renter ID: {relationship.renter_id}
                        </p>
                        <p className="text-sm text-gray-600">
                          Requested on: {new Date(relationship.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAccept(relationship.id)}
                        disabled={processingIds.includes(relationship.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        onClick={() => handleDecline(relationship.id)}
                        disabled={processingIds.includes(relationship.id)}
                        variant="destructive"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Connected Renters Tab */}
        <TabsContent value="connected" className="space-y-4">
          {connectedRenters.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No connected renters</h3>
                <p className="text-gray-600">Accepted renters will appear here</p>
              </CardContent>
            </Card>
          ) : (
            connectedRenters.map((relationship) => (
              <Card key={relationship.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={relationship.renter?.avatar_url || ''} />
                        <AvatarFallback>
                          <User className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">
                          {relationship.renter?.full_name || 'Renter'}
                        </h3>
                        <p className="text-sm text-gray-500 mb-2">
                          Connected since: {new Date(relationship.created_at).toLocaleDateString()}
                        </p>
                        
                        <div className="flex flex-wrap gap-2 mt-3">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDocuments(relationship)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Documents
                          </Button>
                          
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleChat(relationship)}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Chat
                          </Button>
                          
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleComplaints(relationship)}
                          >
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Complaints
                          </Button>
                          
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handlePayments(relationship)}
                          >
                            <DollarSign className="h-4 w-4 mr-1" />
                            Payments
                          </Button>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleDisconnect(relationship.id)}
                      disabled={processingIds.includes(relationship.id)}
                      variant="destructive"
                      size="sm"
                    >
                      <UserMinus className="h-4 w-4 mr-1" />
                      Disconnect
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RentersPage;
