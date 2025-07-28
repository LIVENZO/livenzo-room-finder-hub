
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
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
      <h1 className="text-2xl sm:text-3xl font-bold truncate">
        {isOwner ? 'Your Listed Rooms' : 'Dashboard'}
      </h1>
      
      {isOwner && (
        <Button onClick={() => navigate('/list-room')} className="w-full sm:w-auto flex-shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden xs:inline">List a Room</span>
          <span className="xs:hidden">List Room</span>
        </Button>
      )}
    </div>
  );
};

export default DashboardHeader;
