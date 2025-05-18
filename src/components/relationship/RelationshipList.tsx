
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { updateRelationshipStatus, type Relationship } from '@/services/RelationshipService';
import { User, Check, X, MessageSquare, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

interface RelationshipListProps {
  ownerRelationships: Relationship[];
  renterRelationships: Relationship[];
  onStatusChange?: () => void;
  isOwner: boolean;
  isLoading?: boolean;
}

const RelationshipList: React.FC<RelationshipListProps> = ({ 
  ownerRelationships, 
  renterRelationships, 
  onStatusChange,
  isOwner,
  isLoading = false
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>(isOwner ? 'received' : 'sent');
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  
  const handleAccept = async (relationshipId: string) => {
    setProcessingIds(prev => [...prev, relationshipId]);
    try {
      await updateRelationshipStatus(relationshipId, 'accepted');
      onStatusChange?.();
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== relationshipId));
    }
  };
  
  const handleDecline = async (relationshipId: string) => {
    setProcessingIds(prev => [...prev, relationshipId]);
    try {
      await updateRelationshipStatus(relationshipId, 'declined');
      onStatusChange?.();
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== relationshipId));
    }
  };
  
  const openChat = (roomId: string) => {
    navigate(`/chats/${roomId}`);
  };

  const pendingOwnerRelationships = ownerRelationships.filter(r => r.status === 'pending');
  const activeOwnerRelationships = ownerRelationships.filter(r => r.status === 'accepted');
  
  const pendingRenterRelationships = renterRelationships.filter(r => r.status === 'pending');
  const activeRenterRelationships = renterRelationships.filter(r => r.status === 'accepted');
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Connection Requests</CardTitle>
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value={isOwner ? 'received' : 'sent'}>
              {isOwner ? 'Received' : 'Sent'} Requests
              {isOwner && pendingOwnerRelationships.length > 0 && (
                <Badge variant="destructive" className="ml-2">{pendingOwnerRelationships.length}</Badge>
              )}
              {!isOwner && pendingRenterRelationships.length > 0 && (
                <Badge variant="secondary" className="ml-2">{pendingRenterRelationships.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="active">
              Active Connections
              {isOwner && activeOwnerRelationships.length > 0 && (
                <Badge variant="secondary" className="ml-2">{activeOwnerRelationships.length}</Badge>
              )}
              {!isOwner && activeRenterRelationships.length > 0 && (
                <Badge variant="secondary" className="ml-2">{activeRenterRelationships.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          {isLoading ? (
            <div className="text-center p-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Loading connections...</p>
            </div>
          ) : isOwner ? (
            <>
              <TabsContent value="received" className="space-y-4 mt-4">
                {pendingOwnerRelationships.length === 0 && (
                  <div className="text-center p-4 text-gray-500">
                    No pending requests received.
                  </div>
                )}
                
                {pendingOwnerRelationships.map(relationship => (
                  <div 
                    key={relationship.id} 
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={relationship.renter?.avatar_url || ''} />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{relationship.renter?.full_name || 'Unknown Renter'}</p>
                        <Badge variant="outline" className="mt-1">Renter</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDecline(relationship.id)}
                        disabled={processingIds.includes(relationship.id)}
                      >
                        {processingIds.includes(relationship.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <><X className="h-4 w-4 mr-1" /> Decline</>
                        )}
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleAccept(relationship.id)}
                        disabled={processingIds.includes(relationship.id)}
                      >
                        {processingIds.includes(relationship.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <><Check className="h-4 w-4 mr-1" /> Accept</>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </TabsContent>
              
              <TabsContent value="active" className="space-y-4 mt-4">
                {activeOwnerRelationships.length === 0 && (
                  <div className="text-center p-4 text-gray-500">
                    No active connections.
                  </div>
                )}
                
                {activeOwnerRelationships.map(relationship => (
                  <div 
                    key={relationship.id} 
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={relationship.renter?.avatar_url || ''} />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{relationship.renter?.full_name || 'Unknown Renter'}</p>
                        <Badge variant="outline" className="mt-1">Renter</Badge>
                      </div>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => openChat(relationship.chat_room_id)}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" /> Chat
                    </Button>
                  </div>
                ))}
              </TabsContent>
            </>
          ) : (
            <>
              <TabsContent value="sent" className="space-y-4 mt-4">
                {pendingRenterRelationships.length === 0 && (
                  <div className="text-center p-4 text-gray-500">
                    No pending requests sent.
                  </div>
                )}
                
                {pendingRenterRelationships.map(relationship => (
                  <div 
                    key={relationship.id} 
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={relationship.owner?.avatar_url || ''} />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{relationship.owner?.full_name || 'Unknown Owner'}</p>
                        <Badge variant="outline" className="mt-1">Owner</Badge>
                      </div>
                    </div>
                    <Badge>Pending</Badge>
                  </div>
                ))}
              </TabsContent>
              
              <TabsContent value="active" className="space-y-4 mt-4">
                {activeRenterRelationships.length === 0 && (
                  <div className="text-center p-4 text-gray-500">
                    No active connections.
                  </div>
                )}
                
                {activeRenterRelationships.map(relationship => (
                  <div 
                    key={relationship.id} 
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={relationship.owner?.avatar_url || ''} />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{relationship.owner?.full_name || 'Unknown Owner'}</p>
                        <Badge variant="outline" className="mt-1">Owner</Badge>
                      </div>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => openChat(relationship.chat_room_id)}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" /> Chat
                    </Button>
                  </div>
                ))}
              </TabsContent>
            </>
          )}
        </Tabs>
      </CardHeader>
      <CardContent>
      </CardContent>
    </Card>
  );
};

export default RelationshipList;
