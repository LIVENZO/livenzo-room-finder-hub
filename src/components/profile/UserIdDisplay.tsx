import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Copy, QrCode, IdCard } from 'lucide-react';
import { toast } from 'sonner';
import OwnerQRModal from '@/components/relationship/OwnerQRModal';

interface UserIdDisplayProps {
  publicId: string;
}

const UserIdDisplay: React.FC<UserIdDisplayProps> = ({ publicId }) => {
  const [qrOpen, setQrOpen] = useState(false);

  const copyPublicIdToClipboard = () => {
    navigator.clipboard.writeText(publicId);
    toast.success('Owner ID copied to clipboard');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <IdCard className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-foreground">Your Owner ID</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Share this ID or QR with renters so they can connect with you instantly.
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-background border border-primary/15 p-4 shadow-sm">
        <Input
          id="publicId"
          value={publicId || 'Generating...'}
          readOnly
          className="bg-transparent border-0 shadow-none font-mono text-xl tracking-[0.2em] h-12 text-center font-bold text-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
          placeholder="Generating unique ID..."
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          onClick={copyPublicIdToClipboard}
          disabled={!publicId}
          className="h-12 rounded-xl border-primary/20 hover:bg-primary/5 font-semibold"
        >
          <Copy className="h-4 w-4 mr-2" />
          Copy ID
        </Button>
        <Button
          onClick={() => setQrOpen(true)}
          disabled={!publicId}
          className="h-12 rounded-xl font-semibold shadow-sm"
        >
          <QrCode className="h-4 w-4 mr-2" />
          Show QR
        </Button>
      </div>

      <OwnerQRModal open={qrOpen} onOpenChange={setQrOpen} publicId={publicId} />
    </div>
  );
};

export default UserIdDisplay;
