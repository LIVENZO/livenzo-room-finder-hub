
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Home } from 'lucide-react';
import { Relationship } from '@/types/relationship';

interface DisconnectedStateProps {
  relationship: Relationship;
  onBack: () => void;
}

const DisconnectedState: React.FC<DisconnectedStateProps> = ({
  relationship,
  onBack
}) => {
  const owner = relationship.owner;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <button 
          onClick={onBack}
          className="text-blue-600 hover:underline mb-4"
        >
          ← Back to Find Your Owner
        </button>
        <h1 className="text-3xl font-bold">Connection Ended</h1>
        <p className="text-gray-600">You have successfully disconnected from your property owner</p>
      </div>

      <Card className="mb-6 border-gray-200 bg-gray-50">
        <CardContent className="p-6 text-center">
          <div className="mb-4">
            <Home className="h-12 w-12 mx-auto text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            Connection Ended
          </h3>
          <p className="text-gray-600">
            Your rental connection with {owner?.full_name || 'this owner'} has been terminated.
            You can reconnect with the same owner or find a new property owner.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DisconnectedState;
