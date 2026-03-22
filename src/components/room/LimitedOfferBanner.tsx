import React from 'react';
import { Clock, Sparkles, AlertTriangle } from 'lucide-react';
import { useOfferStatus } from '@/hooks/useOfferStatus';

const TimeBlock = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center">
    <span className="text-xl sm:text-2xl font-bold tabular-nums leading-none text-white">
      {String(value).padStart(2, '0')}
    </span>
    <span className="text-[10px] sm:text-xs text-white/70 uppercase tracking-wider mt-0.5">{label}</span>
  </div>
);

const TimerDisplay = ({ remaining }: { remaining: number }) => {
  const totalSec = Math.floor(remaining / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  return (
    <div className="flex items-center gap-2.5 sm:gap-3 bg-black/20 backdrop-blur-sm rounded-lg px-3 py-2 self-start sm:self-auto shrink-0">
      {d > 0 && (
        <>
          <TimeBlock value={d} label="days" />
          <span className="text-white/50 text-lg font-light leading-none -mt-2">:</span>
        </>
      )}
      <TimeBlock value={h} label="hrs" />
      <span className="text-white/50 text-lg font-light leading-none -mt-2">:</span>
      <TimeBlock value={m} label="min" />
      <span className="text-white/50 text-lg font-light leading-none -mt-2">:</span>
      <TimeBlock value={s} label="sec" />
    </div>
  );
};

const LimitedOfferBanner: React.FC<{ onCtaClick?: () => void }> = ({ onCtaClick }) => {
  const { offerStatus, remaining } = useOfferStatus();

  // Stage 1: Active 7-day offer
  if (offerStatus === 'active_7_day') {
    return (
      <button
        onClick={onCtaClick}
        className="w-full text-left animate-fade-in focus:outline-none group mb-4"
      >
        <div className="relative overflow-hidden rounded-xl shadow-lg bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 p-4 sm:p-5 transition-transform duration-200 group-hover:scale-[1.01] group-active:scale-[0.99]">
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/10" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
            <TimerDisplay remaining={remaining} />
          </div>
        </div>
      </button>
    );
  }

  // Stage 2: Expired — offer ended, no user action available
  if (offerStatus === 'expired' || offerStatus === 'fully_expired') {
    return (
      <div className="w-full animate-fade-in mb-4">
        <div className="relative overflow-hidden rounded-xl shadow-lg bg-gradient-to-r from-gray-800 via-gray-700 to-gray-600 p-4 sm:p-5">
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/5" />
          <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/5" />
          <div className="relative flex flex-col gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                  ⚠️ Your 25% Offer Has Expired
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-white/70 pl-6">
                Your exclusive first month discount window has ended.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Stage 3: Lucky 24h offer active
  if (offerStatus === 'lucky_24h') {
    return (
      <button
        onClick={onCtaClick}
        className="w-full text-left animate-fade-in focus:outline-none group mb-4"
      >
        <div className="relative overflow-hidden rounded-xl shadow-lg bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 p-4 sm:p-5 transition-transform duration-200 group-hover:scale-[1.01] group-active:scale-[0.99]">
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/10" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-white/90 shrink-0" />
                <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                  🎉 Lucky You! 25% OFF Unlocked Again
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-white/80 pl-6">
                You have 24 hours to grab this deal before it disappears.
              </p>
            </div>
            <TimerDisplay remaining={remaining} />
          </div>
        </div>
      </button>
    );
  }

  // fully_expired — no banner
  return null;
};

export default LimitedOfferBanner;
