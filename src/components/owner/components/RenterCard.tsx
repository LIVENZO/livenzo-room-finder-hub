
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
    <Card className="overflow-hidden">
      <CardContent className="p-4 sm:p-6">
        {/* Mobile-first layout */}
        <div className="space-y-4">
          {/* Header section */}
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14 flex-shrink-0">
              <AvatarImage src={relationship.renter?.avatar_url || ''} />
              <AvatarFallback className="bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-foreground truncate">
                {relationship.renter?.full_name || 'Renter'}
              </h3>
              <p className="text-sm text-muted-foreground">
                Connected: {new Date(relationship.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          {/* Action buttons - Mobile optimized */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onDocuments(relationship)}
              className="h-10 text-xs sm:text-sm"
            >
              <FileText className="h-4 w-4 mr-1 flex-shrink-0" />
              <span className="truncate">Documents</span>
            </Button>
            
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onComplaints(relationship)}
              className="h-10 text-xs sm:text-sm"
            >
              <AlertTriangle className="h-4 w-4 mr-1 flex-shrink-0" />
              <span className="truncate">Complaints</span>
            </Button>

            <Button
              onClick={() => onDisconnect(relationship.id)}
              disabled={isProcessing}
              variant="destructive"
              size="sm"
              className="h-10 text-xs sm:text-sm col-span-2 sm:col-span-1"
            >
              <UserMinus className="h-4 w-4 mr-1 flex-shrink-0" />
              <span className="truncate">Disconnect</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RenterCard;
