import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Copy, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import OwnerQRModal from '@/components/relationship/OwnerQRModal';

interface UserIdDisplayProps {
  publicId: string;
}

const UserIdDisplay: React.FC<UserIdDisplayProps> = ({ publicId }) => {
  const [qrOpen, setQrOpen] = useState(false);

  const copyPublicIdToClipboard = () => {
    navigator.clipboard.writeText(publicId);
    toast.success("Owner ID copied to clipboard");
  };

  return (
    <div className="space-y-4">
      <Label htmlFor="publicId" className="text-base font-semibold text-primary">
        Your Owner ID (for renters to find you)
      </Label>
      <div className="flex gap-2">
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
        <Button
          size="lg"
          variant="outline"
          onClick={() => setQrOpen(true)}
          disabled={!publicId}
          title="Show QR code"
          className="h-12 px-4 border-primary/30 hover:bg-primary/10 hover:border-primary/50"
        >
          <QrCode className="h-5 w-5" />
        </Button>
      </div>

      <OwnerQRModal open={qrOpen} onOpenChange={setQrOpen} publicId={publicId} />
    </div>
  );
};

export default UserIdDisplay;
