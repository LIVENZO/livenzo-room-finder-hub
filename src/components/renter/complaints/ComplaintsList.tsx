
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Complaint } from '@/services/ComplaintService';
import ComplaintCard from './ComplaintCard';

interface ComplaintsListProps {
  complaints: Complaint[];
  loading: boolean;
}

const ComplaintsList: React.FC<ComplaintsListProps> = ({ complaints, loading }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Complaints</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center py-8">Loading complaints...</p>
        ) : (
          <div className="space-y-4">
            {complaints.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No complaints submitted yet
              </p>
            ) : (
              complaints.map((complaint) => (
                <ComplaintCard key={complaint.id} complaint={complaint} />
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ComplaintsList;
