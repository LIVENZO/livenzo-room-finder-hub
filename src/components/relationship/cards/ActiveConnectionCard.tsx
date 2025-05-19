
import React from 'react';
import { Button } from '@/components/ui/button';
import { User, MessageSquare } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Relationship } from '@/types/relationship';

interface ActiveConnectionCardProps {
  relationship: Relationship;
  isOwner: boolean;
  onChatOpen: (roomId: string) => void;
}

const ActiveConnectionCard: React.FC<ActiveConnectionCardProps> = ({
  relationship,
  isOwner,
  onChatOpen,
}) => {
  const displayUser = isOwner ? relationship.renter : relationship.owner;

  return (
    <div className="flex items-center justify-between p-3 border rounded-md">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={displayUser?.avatar_url || ''} />
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{displayUser?.full_name || (isOwner ? 'Unknown Renter' : 'Unknown Owner')}</p>
          <Badge variant="outline" className="mt-1">{isOwner ? 'Renter' : 'Owner'}</Badge>
        </div>
      </div>
      <Button 
        size="sm"
        onClick={() => onChatOpen(relationship.chat_room_id)}
      >
        <MessageSquare className="h-4 w-4 mr-1" /> Chat
      </Button>
    </div>
  );
};

export default ActiveConnectionCard;
