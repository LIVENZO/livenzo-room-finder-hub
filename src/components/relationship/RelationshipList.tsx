
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { updateRelationshipStatus, type Relationship } from '@/services/RelationshipService';
import { User, Check, X, MessageSquare } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

interface RelationshipListProps {
  ownerRelationships: Relationship[];
  renterRelationships: Relationship[];
  onStatusChange?: () => void;
  isOwner: boolean;
}

const RelationshipList: React.FC<RelationshipListProps> = ({ 
  ownerRelationships, 
  renterRelationships, 
  onStatusChange,
  isOwner
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>(isOwner ? 'received' : 'sent');
  
  const handleAccept = async (relationshipId: string) => {
    await updateRelationshipStatus(relationshipId, 'accepted');
    onStatusChange?.();
  };
  
  const handleDecline = async (relationshipId: string) => {
    await updateRelationshipStatus(relationshipId, 'declined');
    onStatusChange?.();
  };
  
  const openChat = (roomId: string) => {
    navigate(`/chats/${roomId}`);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Connection Requests</CardTitle>
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value={isOwner ? 'received' : 'sent'}>
              {isOwner ? 'Received' : 'Sent'} Requests
            </TabsTrigger>
            <TabsTrigger value="active">Active Connections</TabsTrigger>
          </TabsList>
          
          {isOwner ? (
            <>
              <TabsContent value="received" className="space-y-4 mt-4">
                {ownerRelationships.filter(r => r.status === 'pending').length === 0 && (
                  <div className="text-center p-4 text-gray-500">
                    No pending requests received.
                  </div>
                )}
                
                {ownerRelationships
                  .filter(r => r.status === 'pending')
                  .map(relationship => (
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
                          <p className="font-medium">{relationship.renter?.full_name}</p>
                          <Badge variant="outline" className="mt-1">Renter</Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDecline(relationship.id)}
                        >
                          <X className="h-4 w-4 mr-1" /> Decline
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handleAccept(relationship.id)}
                        >
                          <Check className="h-4 w-4 mr-1" /> Accept
                        </Button>
                      </div>
                    </div>
                  ))}
              </TabsContent>
              
              <TabsContent value="active" className="space-y-4 mt-4">
                {ownerRelationships.filter(r => r.status === 'accepted').length === 0 && (
                  <div className="text-center p-4 text-gray-500">
                    No active connections.
                  </div>
                )}
                
                {ownerRelationships
                  .filter(r => r.status === 'accepted')
                  .map(relationship => (
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
                          <p className="font-medium">{relationship.renter?.full_name}</p>
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
                {renterRelationships.filter(r => r.status === 'pending').length === 0 && (
                  <div className="text-center p-4 text-gray-500">
                    No pending requests sent.
                  </div>
                )}
                
                {renterRelationships
                  .filter(r => r.status === 'pending')
                  .map(relationship => (
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
                          <p className="font-medium">{relationship.owner?.full_name}</p>
                          <Badge variant="outline" className="mt-1">Owner</Badge>
                        </div>
                      </div>
                      <Badge>Pending</Badge>
                    </div>
                  ))}
              </TabsContent>
              
              <TabsContent value="active" className="space-y-4 mt-4">
                {renterRelationships.filter(r => r.status === 'accepted').length === 0 && (
                  <div className="text-center p-4 text-gray-500">
                    No active connections.
                  </div>
                )}
                
                {renterRelationships
                  .filter(r => r.status === 'accepted')
                  .map(relationship => (
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
                          <p className="font-medium">{relationship.owner?.full_name}</p>
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
