
import React from 'react';
import { Button } from '@/components/ui/button';
import { User, Check, X, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Relationship } from '@/types/relationship';

interface PendingRequestCardProps {
  relationship: Relationship;
  isOwner: boolean;
  onAccept?: (relationshipId: string) => Promise<void>;
  onDecline?: (relationshipId: string) => Promise<void>;
  isProcessing: boolean;
}

const PendingRequestCard: React.FC<PendingRequestCardProps> = ({
  relationship,
  isOwner,
  onAccept,
  onDecline,
  isProcessing,
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
      
      {isOwner ? (
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => onDecline?.(relationship.id)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <><X className="h-4 w-4 mr-1" /> Decline</>
            )}
          </Button>
          <Button 
            size="sm"
            onClick={() => onAccept?.(relationship.id)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <><Check className="h-4 w-4 mr-1" /> Accept</>
            )}
          </Button>
        </div>
      ) : (
        <Badge>Pending</Badge>
      )}
    </div>
  );
};

export default PendingRequestCard;
