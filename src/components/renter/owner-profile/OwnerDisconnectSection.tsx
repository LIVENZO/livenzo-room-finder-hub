
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Relationship } from '@/types/relationship';
import RenterDisconnectButton from '../RenterDisconnectButton';

interface OwnerDisconnectSectionProps {
  relationship: Relationship;
  onDisconnect: () => void;
}

const OwnerDisconnectSection: React.FC<OwnerDisconnectSectionProps> = ({
  relationship,
  onDisconnect
}) => {
  return (
    <Card className="border-red-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-red-800">Disconnect from Owner</h3>
            <p className="text-sm text-red-600">
              End your rental relationship with this owner
            </p>
          </div>
          <RenterDisconnectButton
            relationship={relationship}
            onDisconnect={onDisconnect}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default OwnerDisconnectSection;
