import React, { useState } from 'react';
import { Car, MapPin, Shield, ChevronRight } from 'lucide-react';
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
      {/* Premium sticker above carousel */}
      <button
        onClick={() => setOpen(true)}
        className="w-full mb-3 group"
      >
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-primary-500 via-primary-400 to-secondary-500 shadow-medium transition-all duration-200 group-active:scale-[0.98]">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-background shrink-0 shadow-sm">
            <Car className="h-4.5 w-4.5 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-primary-foreground leading-tight">
              Free Pickup Available
            </p>
            <p className="text-[11px] text-primary-foreground/80 leading-snug mt-0.5">
              Drop to your room within 15 km
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-primary-foreground/60 shrink-0" />
        </div>
      </button>

      {/* Bottom sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl px-6 pb-8 pt-4 max-h-[85vh]">
          {/* Drag handle */}
          <div className="flex justify-center mb-5">
            <div className="w-10 h-1 rounded-full bg-border" />
          </div>

          <SheetHeader className="text-left space-y-1 mb-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 shadow-soft">
                <Car className="h-5 w-5 text-primary-foreground" />
              </div>
              <SheetTitle className="text-xl font-bold text-foreground tracking-tight">
                FREE ROOM DROP
              </SheetTitle>
            </div>
            <SheetDescription className="text-sm text-muted-foreground leading-relaxed pt-2">
              Book this room through Livenzo and we will drop you directly to the property.
            </SheetDescription>
          </SheetHeader>

          {/* Distance badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-200 mb-6">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">Distance limit: 15 km</span>
          </div>

          {/* Benefits */}
          <div className="space-y-3">
            {[
              { icon: Car, label: 'Comfortable ride' },
              { icon: MapPin, label: 'Direct to property' },
              { icon: Shield, label: 'No extra cost' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-accent/60">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500">
                  <Icon className="h-4 w-4 text-primary-foreground" />
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
