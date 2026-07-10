import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Share2, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface OwnerQRModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  publicId: string;
}

const OwnerQRModal: React.FC<OwnerQRModalProps> = ({ open, onOpenChange, publicId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    if (!open || !publicId) return;
    const payload = `livenzo:owner:${publicId}`;
    QRCode.toDataURL(payload, {
      width: 512,
      margin: 2,
      color: { dark: '#1a1033', light: '#ffffff' },
      errorCorrectionLevel: 'H',
    }).then(setDataUrl).catch(() => toast.error('Failed to generate QR'));
  }, [open, publicId]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `livenzo-owner-${publicId}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success('QR downloaded');
  };

  const handleShare = async () => {
    if (!dataUrl) return;
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `livenzo-owner-${publicId}.png`, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My Livenzo Owner ID',
          text: `Scan this QR to connect with me on Livenzo. Owner ID: ${publicId}`,
        });
      } else if (navigator.share) {
        await navigator.share({
          title: 'My Livenzo Owner ID',
          text: `Scan this QR to connect with me on Livenzo. Owner ID: ${publicId}`,
        });
      } else {
        handleDownload();
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') toast.error('Sharing not supported');
    }
  };

  const copyId = () => {
    navigator.clipboard.writeText(publicId);
    toast.success('Owner ID copied');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-sm rounded-3xl p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 via-background to-background p-6 pb-4">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold">Your Owner QR</DialogTitle>
          </DialogHeader>
          <p className="text-center text-sm text-muted-foreground mt-1">
            Renters can scan this to connect instantly
          </p>
        </div>

        <div className="px-6 pb-6 space-y-5">
          <div className="mx-auto w-full max-w-[280px] aspect-square rounded-2xl bg-white shadow-soft border border-border/50 flex items-center justify-center overflow-hidden">
            {dataUrl ? (
              <img src={dataUrl} alt="Owner QR Code" className="w-full h-full object-contain p-3" />
            ) : (
              <div className="text-sm text-muted-foreground">Generating…</div>
            )}
          </div>

          <button
            onClick={copyId}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-muted/50 hover:bg-muted transition font-mono text-sm tracking-wider"
          >
            <span className="font-bold">{publicId}</span>
            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
          </button>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={handleDownload} className="h-12 rounded-xl">
              <Download className="h-4 w-4 mr-2" /> Download
            </Button>
            <Button onClick={handleShare} className="h-12 rounded-xl">
              <Share2 className="h-4 w-4 mr-2" /> Share
            </Button>
          </div>
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
};

export default OwnerQRModal;
