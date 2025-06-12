
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

interface UserIdDisplayProps {
  publicId: string;
}

const UserIdDisplay: React.FC<UserIdDisplayProps> = ({ publicId }) => {
  const copyPublicIdToClipboard = () => {
    navigator.clipboard.writeText(publicId);
    toast.success("Owner ID copied to clipboard");
  };

  return (
    <div className="grid gap-2">
      <Label htmlFor="publicId">Your Owner ID (for renters to find you)</Label>
      <div className="flex gap-2">
        <Input 
          id="publicId"
          value={publicId || 'Generating...'}
          readOnly
          className="bg-gray-50 font-mono text-lg tracking-wider"
          placeholder="Generating unique ID..."
        />
        <Button
          size="icon"
          variant="outline"
          onClick={copyPublicIdToClipboard}
          disabled={!publicId}
          title="Copy Owner ID to clipboard"
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-gray-500 mt-1">
        Share this 10-character ID with potential renters so they can connect with you easily
      </p>
    </div>
  );
};

export default UserIdDisplay;
