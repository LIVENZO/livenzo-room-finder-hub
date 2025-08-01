
import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft } from 'lucide-react';
import { Relationship } from '@/types/relationship';

interface RenterHeaderProps {
  relationship: Relationship;
  onBack: () => void;
}

const RenterHeader: React.FC<RenterHeaderProps> = ({ relationship, onBack }) => {
  return (
    <div className="space-y-4">
      {/* Back Button - Mobile Optimized */}
      <Button 
        variant="ghost" 
        onClick={onBack}
        className="w-full sm:w-auto justify-start gap-2 h-11"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Renters</span>
      </Button>
      
      {/* Renter Info Card */}
      <div className="bg-card rounded-lg border p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Avatar className="h-16 w-16 sm:h-20 sm:w-20 mx-auto sm:mx-0">
            <AvatarImage src={relationship.renter?.avatar_url || ''} />
            <AvatarFallback className="text-xl">
              {relationship.renter?.full_name?.charAt(0) || 'R'}
            </AvatarFallback>
          </Avatar>
          <div className="text-center sm:text-left w-full min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground break-words">
              {relationship.renter?.full_name || 'Unknown Renter'}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base mt-1">
              Connected since {new Date(relationship.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RenterHeader;
