
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  MessageSquare, 
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Relationship } from '@/types/relationship';

interface OwnerProfileActionsProps {
  relationship: Relationship;
  isDisconnected: boolean;
}

const OwnerProfileActions: React.FC<OwnerProfileActionsProps> = ({
  relationship,
  isDisconnected
}) => {
  const navigate = useNavigate();

  const handleViewDocuments = () => {
    if (isDisconnected) return;
    navigate(`/connections/${relationship.id}`);
  };

  const handleChatWithOwner = () => {
    if (isDisconnected) return;
    navigate(`/chats/${relationship.chat_room_id}`);
  };

  const handleRaiseComplaint = () => {
    if (isDisconnected) return;
    // For now, open chat - can be enhanced later with a dedicated complaint system
    navigate(`/chats/${relationship.chat_room_id}`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Button 
        onClick={handleViewDocuments}
        variant="outline" 
        className="h-16 flex-col space-y-2"
        disabled={isDisconnected}
      >
        <FileText className="h-6 w-6" />
        <span>View Documents</span>
      </Button>
      
      <Button 
        onClick={handleRaiseComplaint}
        variant="outline" 
        className="h-16 flex-col space-y-2"
        disabled={isDisconnected}
      >
        <AlertCircle className="h-6 w-6" />
        <span>Raise a Complaint</span>
      </Button>
      
      <Button 
        onClick={handleChatWithOwner}
        variant="outline" 
        className="h-16 flex-col space-y-2"
        disabled={isDisconnected}
      >
        <MessageSquare className="h-6 w-6" />
        <span>Chat with Owner</span>
      </Button>
    </div>
  );
};

export default OwnerProfileActions;
