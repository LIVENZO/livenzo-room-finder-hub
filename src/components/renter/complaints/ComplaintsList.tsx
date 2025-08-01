
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
    <div className="space-y-4 p-4">
      <h3 className="text-lg font-semibold mb-4">Your Complaints</h3>
      {loading ? (
        <div className="bg-card rounded-xl p-6 text-center shadow-sm">
          <p>Loading complaints...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {complaints.length === 0 ? (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 text-center border border-blue-100">
              <p className="text-muted-foreground">
                No complaints submitted yet
              </p>
            </div>
          ) : (
            complaints.map((complaint) => (
              <ComplaintCard key={complaint.id} complaint={complaint} />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ComplaintsList;
