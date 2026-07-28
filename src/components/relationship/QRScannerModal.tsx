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
  const onScanRef = useRef(onScan);
  const onOpenChangeRef = useRef(onOpenChange);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onScanRef.current = onScan;
    onOpenChangeRef.current = onOpenChange;
  }, [onScan, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setError(null);
    setStarting(true);

    const start = async () => {
      try {
        // wait for DOM (dialog animation)
        await new Promise((r) => setTimeout(r, 150));
        if (cancelled) return;
        const el = document.getElementById(SCANNER_ID);
        if (!el) {
          throw new Error('Scanner container not found');
        }
        const scanner = new Html5Qrcode(SCANNER_ID, { verbose: false });
        scannerRef.current = scanner;

        // Prefer explicit back camera when available (more reliable on Android)
        let cameraConfig: MediaTrackConstraints | { facingMode: string } = {
          facingMode: { ideal: 'environment' } as any,
        };
        try {
          const devices = await Html5Qrcode.getCameras();
          if (devices && devices.length) {
            const back = devices.find((d) => /back|rear|environment/i.test(d.label)) || devices[devices.length - 1];
            cameraConfig = { deviceId: { exact: back.id } } as any;
          }
        } catch {
          // fall back to facingMode
        }

        if (cancelled) return;
        await scanner.start(
          cameraConfig as any,
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText) => {
            const id = parseOwnerId(decodedText);
            if (!id) {
              toast.error('Invalid QR code');
              return;
            }
            scanner.stop().catch(() => {}).finally(() => {
              onScanRef.current(id);
              onOpenChangeRef.current(false);
            });
          },
          () => {}
        );
        if (cancelled) {
          scanner.stop().catch(() => {});
          return;
        }
        setStarting(false);
      } catch (err: any) {
        console.error('QR scanner start failed:', err);
        const msg = String(err?.message || err?.name || '');
        setError(
          /Permission|NotAllowed/i.test(msg)
            ? 'Camera permission denied. Enable camera access in your browser/app settings.'
            : /NotFound|Devices/i.test(msg)
            ? 'No camera found on this device.'
            : /NotReadable|TrackStart|in use/i.test(msg)
            ? 'Camera is being used by another app. Close it and try again.'
            : 'Unable to start camera. Please try again.'
        );
        setStarting(false);
      }
    };
    start();

    return () => {
      cancelled = true;
      const s = scannerRef.current;
      if (s) {
        // Only stop if actually scanning; ignore errors
        try {
          const state = (s as any).getState?.();
          // 2 = SCANNING in html5-qrcode
          if (state === 2) {
            s.stop().catch(() => {}).finally(() => {
              try { s.clear(); } catch {}
            });
          } else {
            try { s.clear(); } catch {}
          }
        } catch {
          s.stop().catch(() => {});
        }
        scannerRef.current = null;
      }
    };
  }, [open]);


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
