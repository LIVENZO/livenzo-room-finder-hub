
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Complaint } from '@/services/ComplaintService';
import OwnerComplaintCard from './OwnerComplaintCard';

interface OwnerComplaintsListProps {
  complaints: Complaint[];
  loading: boolean;
  onComplaintUpdated: () => void;
}

const OwnerComplaintsList: React.FC<OwnerComplaintsListProps> = ({ 
  complaints, 
  loading, 
  onComplaintUpdated 
}) => {
  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center">Loading complaints...</p>
        </CardContent>
      </Card>
    );
  }

  if (complaints.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Complaints</CardTitle>
        </CardHeader>
        <CardContent className="py-8">
          <p className="text-gray-500 text-center">No complaints submitted yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Complaints ({complaints.length})</h3>
      {complaints.map((complaint) => (
        <OwnerComplaintCard
          key={complaint.id}
          complaint={complaint}
          onComplaintUpdated={onComplaintUpdated}
        />
      ))}
    </div>
  );
};

export default OwnerComplaintsList;
