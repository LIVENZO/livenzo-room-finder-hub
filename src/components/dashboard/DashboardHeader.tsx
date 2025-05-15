
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface DashboardHeaderProps {
  isOwner: boolean;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ isOwner }) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold">
        {isOwner ? 'Your Listed Rooms' : 'Dashboard'}
      </h1>
      
      {isOwner && (
        <Button onClick={() => navigate('/list-room')}>
          <Plus className="mr-2 h-4 w-4" />
          List a Room
        </Button>
      )}
    </div>
  );
};

export default DashboardHeader;
