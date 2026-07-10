import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface QRScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (ownerId: string) => void;
}

const SCANNER_ID = 'livenzo-qr-scanner-region';

// Parse "livenzo:owner:<id>" or plain 3–10 char alphanumeric
const parseOwnerId = (raw: string): string | null => {
  if (!raw) return null;
  const trimmed = raw.trim();
  const prefixMatch = trimmed.match(/^livenzo:owner:([a-zA-Z0-9]{3,10})$/i);
  if (prefixMatch) return prefixMatch[1].toLowerCase();
  const plain = trimmed.toLowerCase();
  if (/^[a-z0-9]{3,10}$/.test(plain)) return plain;
  // Try URL like ?owner=xxxx
  try {
    const u = new URL(trimmed);
    const id = u.searchParams.get('owner') || u.searchParams.get('ownerId');
    if (id && /^[a-z0-9]{3,10}$/i.test(id)) return id.toLowerCase();
  } catch {}
  return null;
};

const QRScannerModal: React.FC<QRScannerModalProps> = ({ open, onOpenChange, onScan }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setError(null);
    setStarting(true);

    const start = async () => {
      try {
        // wait for DOM
        await new Promise((r) => setTimeout(r, 50));
        if (cancelled) return;
        const scanner = new Html5Qrcode(SCANNER_ID, { verbose: false });
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText) => {
            const id = parseOwnerId(decodedText);
            if (!id) {
              toast.error('Invalid QR code');
              return;
            }
            // stop before firing to avoid double-fire
            scanner.stop().catch(() => {}).finally(() => {
              onScan(id);
              onOpenChange(false);
            });
          },
          () => {}
        );
        setStarting(false);
      } catch (err: any) {
        console.error(err);
        setError(
          err?.message?.includes('Permission')
            ? 'Camera permission denied. Enable camera access to scan.'
            : 'Unable to access camera'
        );
        setStarting(false);
      }
    };
    start();

    return () => {
      cancelled = true;
      const s = scannerRef.current;
      if (s) {
        s.stop().catch(() => {}).finally(() => {
          s.clear();
        });
        scannerRef.current = null;
      }
    };
  }, [open, onScan, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-sm rounded-3xl p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 via-background to-background px-6 pt-6 pb-3">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold">Scan Owner QR</DialogTitle>
          </DialogHeader>
          <p className="text-center text-sm text-muted-foreground mt-1">
            Point your camera at the owner's QR code
          </p>
        </div>

        <div className="px-6 pb-6">
          <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-black border border-border/50">
            <div id={SCANNER_ID} className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover" />
            {starting && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span className="text-sm">Starting camera…</span>
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center p-6 bg-black/70 text-white text-sm text-center">
                {error}
              </div>
            )}
            {/* corner frame */}
            {!error && (
              <div className="pointer-events-none absolute inset-6 rounded-xl border-2 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]" />
            )}
          </div>
          <p className="text-xs text-center text-muted-foreground mt-3">
            The Owner ID will be filled automatically after scanning.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRScannerModal;
