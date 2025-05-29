
import React, { useState, useEffect } from 'react';
import { fetchComplaintsForRelationship, type Complaint } from '@/services/ComplaintService';
import { supabase } from '@/integrations/supabase/client';
import ComplaintForm from './complaints/ComplaintForm';
import ComplaintsList from './complaints/ComplaintsList';

interface RenterComplaintsProps {
  relationshipId: string;
}

const RenterComplaints: React.FC<RenterComplaintsProps> = ({ relationshipId }) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [ownerId, setOwnerId] = useState<string>('');

  useEffect(() => {
    loadComplaints();
    fetchRelationshipDetails();
  }, [relationshipId]);

  const fetchRelationshipDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('relationships')
        .select('owner_id')
        .eq('id', relationshipId)
        .single();

      if (error) {
        console.error('Error fetching relationship:', error);
        return;
      }

      setOwnerId(data.owner_id);
    } catch (error) {
      console.error('Exception fetching relationship:', error);
    }
  };

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

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4">
      <ComplaintForm 
        relationshipId={relationshipId}
        ownerId={ownerId}
        onComplaintSubmitted={loadComplaints}
      />
      <ComplaintsList 
        complaints={complaints}
        loading={loading}
      />
    </div>
  );
};

export default RenterComplaints;
