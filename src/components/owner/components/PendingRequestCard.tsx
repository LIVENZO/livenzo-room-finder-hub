
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Relationship } from '@/types/relationship';

interface PendingRequestCardProps {
  relationship: Relationship;
  onAccept: (relationshipId: string) => void;
  onDecline: (relationshipId: string) => void;
  isProcessing: boolean;
}

const PendingRequestCard: React.FC<PendingRequestCardProps> = ({
  relationship,
  onAccept,
  onDecline,
  isProcessing,
}) => {
  return (
    <Card>
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
              onClick={() => onAccept(relationship.id)}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Accept
            </Button>
            <Button
              onClick={() => onDecline(relationship.id)}
              disabled={isProcessing}
              variant="destructive"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Decline
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PendingRequestCard;
