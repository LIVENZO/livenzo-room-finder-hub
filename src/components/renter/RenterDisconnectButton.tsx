
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Unlink } from 'lucide-react';
import { disconnectFromOwner } from '@/services/relationship/manageRelationships';
import { Relationship } from '@/types/relationship';

interface RenterDisconnectButtonProps {
  relationship: Relationship;
  onDisconnect: () => void;
  className?: string;
}

const RenterDisconnectButton: React.FC<RenterDisconnectButtonProps> = ({
  relationship,
  onDisconnect,
  className = ""
}) => {
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      const success = await disconnectFromOwner(relationship.id, relationship.renter_id);
      if (success) {
        onDisconnect();
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant="destructive" 
          className={`flex items-center gap-2 ${className}`}
          disabled={isDisconnecting}
        >
          <Unlink className="h-4 w-4" />
          {isDisconnecting ? 'Disconnecting...' : 'Disconnect from Owner'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Disconnect from Property Owner</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to disconnect from{' '}
              <span className="font-semibold">{relationship.owner?.full_name || 'this owner'}</span>?
            </p>
            <p className="text-sm text-muted-foreground">
              This will end your current rental connection. You can reconnect with the same owner later if needed.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mt-3">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> Your chat history, documents, and notices will be moved to "Previous Connections" 
                if you connect with a new owner.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDisconnecting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDisconnect}
            disabled={isDisconnecting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDisconnecting ? 'Disconnecting...' : 'Confirm Disconnect'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default RenterDisconnectButton;
