import React, { useState } from 'react';
import { Car } from 'lucide-react';
import FreeDropSheet from './FreeDropSheet';

const FreeDropOverlay: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating badge – positioned by parent via absolute */}
      <button
        onClick={() => setOpen(true)}
        className="absolute top-3 right-3 z-10 w-11 h-11 rounded-full bg-background/95 backdrop-blur-sm shadow-lg ring-1 ring-primary/10 flex items-center justify-center animate-[slideGlow_0.5s_ease-out_both]"
        aria-label="Free drop service"
      >
        <Car className="h-5 w-5 text-primary" />
      </button>

      <FreeDropSheet open={open} onOpenChange={setOpen} />
    </>
  );
};

export default FreeDropOverlay;
