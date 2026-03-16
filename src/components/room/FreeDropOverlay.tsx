import React, { useState } from 'react';
import { Car, MapPin, Shield } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

const FreeDropOverlay: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Minimal car sticker above carousel */}
      <div className="flex justify-center mb-3">
        <button
          onClick={() => setOpen(true)}
          className="relative w-11 h-11 rounded-full bg-background shadow-md flex items-center justify-center transition-transform duration-200 active:scale-95 animate-[bounce_2s_ease-in-out_1]"
          aria-label="Free drop service"
        >
          <Car className="h-5 w-5 text-primary" />
          {/* Subtle pulse ring */}
          <span className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping pointer-events-none" style={{ animationIterationCount: 3, animationDuration: '1.5s' }} />
        </button>
      </div>

      {/* Bottom sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl px-6 pb-8 pt-4 max-h-[85vh]">
          <div className="flex justify-center mb-5">
            <div className="w-10 h-1 rounded-full bg-border" />
          </div>

          <SheetHeader className="text-left space-y-1 mb-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-primary/10">
                <Car className="h-5 w-5 text-primary" />
              </div>
              <SheetTitle className="text-xl font-bold text-foreground tracking-tight">
                FREE ROOM DROP
              </SheetTitle>
            </div>
            <SheetDescription className="text-sm text-muted-foreground leading-relaxed pt-2">
              Book this room through Livenzo and we will drop you directly to the property.
            </SheetDescription>
          </SheetHeader>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/15 mb-6">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">Distance limit: 15 km</span>
          </div>

          <div className="space-y-3">
            {[
              { icon: Car, label: 'Comfortable ride' },
              { icon: MapPin, label: 'Direct to property' },
              { icon: Shield, label: 'No extra cost' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-accent/60">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">{label}</span>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default FreeDropOverlay;
