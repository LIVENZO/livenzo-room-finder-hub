import React, { useState, useEffect, useCallback } from 'react';
import { Clock } from 'lucide-react';

const OFFER_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const STORAGE_KEY = 'livenzo_offer_start';

const getStartTime = (): number => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return parseInt(stored, 10);
  const now = Date.now();
  localStorage.setItem(STORAGE_KEY, now.toString());
  return now;
};

const LimitedOfferBanner: React.FC<{ onCtaClick?: () => void }> = ({ onCtaClick }) => {
  const [remaining, setRemaining] = useState<number>(() => {
    const end = getStartTime() + OFFER_DURATION_MS;
    return Math.max(0, end - Date.now());
  });

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => {
      const end = getStartTime() + OFFER_DURATION_MS;
      const left = Math.max(0, end - Date.now());
      setRemaining(left);
      if (left <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [remaining > 0]);

  if (remaining <= 0) return null;

  const totalSec = Math.floor(remaining / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <span className="text-xl sm:text-2xl font-bold tabular-nums leading-none text-white">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[10px] sm:text-xs text-white/70 uppercase tracking-wider mt-0.5">{label}</span>
    </div>
  );

  return (
    <button
      onClick={onCtaClick}
      className="w-full text-left animate-fade-in focus:outline-none group"
    >
      <div className="relative overflow-hidden rounded-xl shadow-lg bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 p-4 sm:p-5 transition-transform duration-200 group-hover:scale-[1.01] group-active:scale-[0.99]">
        {/* Decorative circles */}
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
        <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/10" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Text */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-white/90 shrink-0" />
              <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                ⏰ 25% OFF First Month Rent
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-white/80 pl-6">
              Limited time offer. Book your room before it ends.
            </p>
          </div>

          {/* Timer */}
          <div className="flex items-center gap-2.5 sm:gap-3 bg-black/20 backdrop-blur-sm rounded-lg px-3 py-2 self-start sm:self-auto shrink-0">
            <TimeBlock value={d} label="days" />
            <span className="text-white/50 text-lg font-light leading-none -mt-2">:</span>
            <TimeBlock value={h} label="hrs" />
            <span className="text-white/50 text-lg font-light leading-none -mt-2">:</span>
            <TimeBlock value={m} label="min" />
            <span className="text-white/50 text-lg font-light leading-none -mt-2">:</span>
            <TimeBlock value={s} label="sec" />
          </div>
        </div>
      </div>
    </button>
  );
};

export default LimitedOfferBanner;
