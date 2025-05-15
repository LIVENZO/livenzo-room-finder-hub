
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const EmptyOwnerState: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="text-center py-12 bg-gray-50 rounded-lg">
      <h3 className="text-xl font-medium mb-2">No rooms listed yet</h3>
      <p className="text-gray-500 mb-4">
        Get started by listing your first room.
      </p>
      <Button onClick={() => navigate('/list-room')}>List Your First Room</Button>
    </div>
  );
};

export default EmptyOwnerState;
