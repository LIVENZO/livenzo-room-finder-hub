
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  FileText, 
  AlertTriangle,
  UserMinus
} from 'lucide-react';
import { Relationship } from '@/types/relationship';

interface RenterCardProps {
  relationship: Relationship;
  onDocuments: (relationship: Relationship) => void;
  onComplaints: (relationship: Relationship) => void;
  onDisconnect: (relationshipId: string) => void;
  isProcessing: boolean;
}

const RenterCard: React.FC<RenterCardProps> = ({
  relationship,
  onDocuments,
  onComplaints,
  onDisconnect,
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
                  onClick={() => onDocuments(relationship)}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Documents
                </Button>
                
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onComplaints(relationship)}
                >
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Complaints
                </Button>
              </div>
            </div>
          </div>

          <Button
            onClick={() => onDisconnect(relationship.id)}
            disabled={isProcessing}
            variant="destructive"
            size="sm"
          >
            <UserMinus className="h-4 w-4 mr-1" />
            Disconnect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RenterCard;
