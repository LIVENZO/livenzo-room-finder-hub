
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UsersIcon } from 'lucide-react';

const RenterDashboard: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="text-center py-12 bg-gray-50 rounded-lg">
      <h3 className="text-xl font-medium mb-2">You're signed in as a renter</h3>
      <p className="text-gray-500 mb-6">
        Browse available rooms to find your perfect match.
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <Button onClick={() => navigate('/find-room')}>Find a Room</Button>
        <Button 
          onClick={() => navigate('/connections')}
          variant="outline"
          className="flex items-center gap-2"
        >
          <UsersIcon className="h-4 w-4" />
          Manage Connections
        </Button>
      </div>
    </div>
  );
};

export default RenterDashboard;
