
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
    <div className="space-y-4">
      <Label htmlFor="publicId" className="text-base font-semibold text-primary">
        Your Owner ID (for renters to find you)
      </Label>
      <div className="flex gap-3">
        <Input 
          id="publicId"
          value={publicId || 'Generating...'}
          readOnly
          className="bg-muted/30 font-mono text-lg tracking-wider h-12 text-center font-bold border-primary/20 focus-visible:ring-primary/20"
          placeholder="Generating unique ID..."
        />
        <Button
          size="lg"
          variant="outline"
          onClick={copyPublicIdToClipboard}
          disabled={!publicId}
          title="Copy Owner ID to clipboard"
          className="h-12 px-4 border-primary/30 hover:bg-primary/10 hover:border-primary/50"
        >
          <Copy className="h-5 w-5" />
        </Button>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed bg-muted/20 p-3 rounded-lg border">
        Share this unique 10-character ID with potential renters so they can connect with you easily. 
        This ID helps maintain your privacy while allowing renters to find you.
      </p>
    </div>
  );
};

export default UserIdDisplay;
