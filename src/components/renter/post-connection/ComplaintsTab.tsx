
import React from 'react';
import RenterComplaints from '@/components/renter/RenterComplaints';

interface ComplaintsTabProps {
  relationshipId: string;
}

const ComplaintsTab: React.FC<ComplaintsTabProps> = ({ relationshipId }) => {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <RenterComplaints relationshipId={relationshipId} />
      </div>
    </div>
  );
};

export default ComplaintsTab;
