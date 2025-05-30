
import React, { useState } from 'react';
import { Relationship } from '@/types/relationship';
import OwnerProfileHeader from './owner-profile/OwnerProfileHeader';
import OwnerProfileActions from './owner-profile/OwnerProfileActions';
import OwnerDisconnectSection from './owner-profile/OwnerDisconnectSection';
import DisconnectedState from './owner-profile/DisconnectedState';

interface OwnerProfilePageProps {
  relationship: Relationship;
  onBack: () => void;
}

const OwnerProfilePage: React.FC<OwnerProfilePageProps> = ({
  relationship,
  onBack,
}) => {
  const [isDisconnected, setIsDisconnected] = useState(false);

  const handleDisconnect = () => {
    setIsDisconnected(true);
    // Navigate back after a short delay to show the success message
    setTimeout(() => {
      onBack();
    }, 1500);
  };

  // If disconnected, show a simplified view
  if (isDisconnected) {
    return (
      <DisconnectedState
        relationship={relationship}
        onBack={onBack}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <button 
          onClick={onBack}
          className="text-blue-600 hover:underline mb-4"
        >
          ← Back to Find Your Owner
        </button>
        <h1 className="text-3xl font-bold">Your Property Owner</h1>
        <p className="text-gray-600">Manage your rental relationship and communications</p>
      </div>

      {/* Owner Profile Card */}
      <OwnerProfileHeader relationship={relationship} />

      {/* Action Buttons */}
      <OwnerProfileActions 
        relationship={relationship} 
        isDisconnected={isDisconnected} 
      />

      {/* Disconnect Button */}
      <OwnerDisconnectSection
        relationship={relationship}
        onDisconnect={handleDisconnect}
      />
    </div>
  );
};

export default OwnerProfilePage;
