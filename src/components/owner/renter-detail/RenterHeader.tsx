
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
    <div className="flex items-center gap-4">
      <Button variant="outline" onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Renters
      </Button>
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={relationship.renter?.avatar_url || ''} />
          <AvatarFallback className="text-xl">
            {relationship.renter?.full_name?.charAt(0) || 'R'}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">
            {relationship.renter?.full_name || 'Unknown Renter'}
          </h1>
          <p className="text-gray-500">
            Connected since {new Date(relationship.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RenterHeader;
