
import React from 'react';
import UserSearch from '@/components/relationship/UserSearch';
import RelationshipList from '@/components/relationship/RelationshipList';
import { Relationship } from '@/types/relationship';

interface ConnectionOverviewProps {
  currentUserId: string;
  isOwner: boolean;
  ownerRelationships: Relationship[];
  renterRelationships: Relationship[];
  onRelationshipSelect: (relationship: Relationship) => void;
  onStatusChange: () => void;
  isLoading: boolean;
}

const ConnectionOverview: React.FC<ConnectionOverviewProps> = ({
  currentUserId,
  isOwner,
  ownerRelationships,
  renterRelationships,
  onRelationshipSelect,
  onStatusChange,
  isLoading,
}) => {
  return (
    <>
      {!isOwner && (
        <div className="mb-6">
          <UserSearch currentUserId={currentUserId} />
        </div>
      )}
      
      <RelationshipList
        ownerRelationships={ownerRelationships}
        renterRelationships={renterRelationships}
        onStatusChange={onStatusChange}
        isOwner={isOwner}
        isLoading={isLoading}
        onRelationshipSelect={onRelationshipSelect}
      />
    </>
  );
};

export default ConnectionOverview;
