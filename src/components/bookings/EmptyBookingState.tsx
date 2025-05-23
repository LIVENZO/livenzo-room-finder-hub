
import React from 'react';
import { Button } from '@/components/ui/button';

interface EmptyBookingStateProps {
  type: 'user' | 'owner';
  onNavigate: (path: string) => void;
}

const EmptyBookingState: React.FC<EmptyBookingStateProps> = ({ type, onNavigate }) => {
  if (type === 'user') {
    return (
      <div className="text-center py-10">
        <p className="text-xl text-gray-500 mb-4">You haven't made any booking requests yet</p>
        <Button onClick={() => onNavigate('/find-room')}>Find Rooms</Button>
      </div>
    );
  }

  return (
    <div className="text-center py-10">
      <p className="text-xl text-gray-500 mb-4">You haven't received any booking requests yet</p>
      <Button onClick={() => onNavigate('/list-room')}>List Your Room</Button>
    </div>
  );
};

export default EmptyBookingState;
