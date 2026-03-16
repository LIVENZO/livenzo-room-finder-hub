import React, { useState, useRef, useEffect } from 'react';
import { Car } from 'lucide-react';

const FreeDropOverlay: React.FC = () => {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [open]);

  return (
    <>
      {/* Car icon button */}
      <button
        onClick={() => setOpen(true)}
        className="absolute top-3 right-3 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm shadow-md border border-border/40 transition-transform duration-200 hover:scale-105 active:scale-95"
        aria-label="Free drop info"
      >
        <Car className="h-5 w-5 text-foreground/80" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[2px]"
          style={{ transition: 'opacity 350ms ease-in-out' }}
        />
      )}

      {/* Slide-in panel */}
      <div
        ref={panelRef}
        className={`fixed top-1/2 right-0 z-50 -translate-y-1/2 transition-transform duration-[350ms] ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="mr-3 w-56 rounded-2xl bg-background shadow-xl border border-border/30 p-5">
          {/* Accent line */}
          <div className="w-8 h-1 rounded-full bg-primary/60 mb-4" />

          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 shrink-0">
              <Car className="h-4.5 w-4.5 text-primary" />
            </div>
            <div className="space-y-0.5">
              <p className="text-base font-semibold text-foreground leading-tight">
                Free Drop
              </p>
              <p className="text-xs text-muted-foreground leading-snug">
                to your accommodation
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/30">
            <p className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wider">
              Under 15 km
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default FreeDropOverlay;
