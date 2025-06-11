
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

interface UserIdDisplayProps {
  userId: string;
}

const UserIdDisplay: React.FC<UserIdDisplayProps> = ({ userId }) => {
  const copyUserIdToClipboard = () => {
    // Always copy the full UID
    navigator.clipboard.writeText(userId);
    toast.success("User ID copied to clipboard");
  };

  // Display only first 8 characters
  const displayUserId = userId.substring(0, 8);

  return (
    <div className="grid gap-2">
      <Label htmlFor="userId">Your User ID (for renters to find you)</Label>
      <div className="flex gap-2">
        <Input 
          id="userId"
          value={displayUserId}
          readOnly
          className="bg-gray-50 font-mono text-sm"
          title={`Full ID: ${userId}`} // Show full ID on hover
        />
        <Button
          size="icon"
          variant="outline"
          onClick={copyUserIdToClipboard}
          title="Copy full ID to clipboard"
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-gray-500 mt-1">
        Share this ID with potential renters so they can connect with you
      </p>
    </div>
  );
};

export default UserIdDisplay;
