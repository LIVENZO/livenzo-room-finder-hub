
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const RenterDashboard: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="text-center py-12 bg-gray-50 rounded-lg">
      <h3 className="text-xl font-medium mb-2">You're signed in as a renter</h3>
      <p className="text-gray-500 mb-4">
        Browse available rooms to find your perfect match.
      </p>
      <Button onClick={() => navigate('/find-room')}>Find a Room</Button>
    </div>
  );
};

export default RenterDashboard;
