
import React from 'react';
import RenterComplaints from '@/components/renter/RenterComplaints';

interface ComplaintsTabProps {
  relationshipId: string;
}

const ComplaintsTab: React.FC<ComplaintsTabProps> = ({ relationshipId }) => {
  return <RenterComplaints relationshipId={relationshipId} />;
};

export default ComplaintsTab;
