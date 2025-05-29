
import React, { useState, useEffect } from 'react';
import { fetchComplaintsForRelationship, type Complaint } from '@/services/ComplaintService';
import OwnerComplaintsList from './complaints/OwnerComplaintsList';

interface ComplaintsTabProps {
  relationshipId: string;
}

const ComplaintsTab: React.FC<ComplaintsTabProps> = ({ relationshipId }) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const complaintsData = await fetchComplaintsForRelationship(relationshipId);
      setComplaints(complaintsData);
    } catch (error) {
      console.error('Error loading complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, [relationshipId]);

  return (
    <OwnerComplaintsList
      complaints={complaints}
      loading={loading}
      onComplaintUpdated={loadComplaints}
    />
  );
};

export default ComplaintsTab;
