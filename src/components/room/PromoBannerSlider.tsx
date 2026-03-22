import React, { useState, useEffect, useCallback, useRef } from "react";
import { Clock, Sparkles, AlertTriangle, MapPin, Car } from "lucide-react";
import { useOfferStatus, OfferStatus } from "@/hooks/useOfferStatus";
import { cn } from "@/lib/utils";

/* ── Timer helpers ── */
const TimeBlock = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center">
    <span className="text-lg font-bold tabular-nums leading-none text-white">{String(value).padStart(2, "0")}</span>
    <span className="text-[9px] text-white/70 uppercase tracking-wider mt-0.5">{label}</span>
  </div>
);

const CompactTimer = ({ remaining }: { remaining: number }) => {
  const totalSec = Math.floor(remaining / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  return (
    <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-sm rounded-lg px-2.5 py-1.5 shrink-0">
      {d > 0 && (
        <>
          <TimeBlock value={d} label="d" />
          <span className="text-white/40 text-sm leading-none -mt-2">:</span>
        </>
      )}
      <TimeBlock value={h} label="h" />
      <span className="text-white/40 text-sm leading-none -mt-2">:</span>
      <TimeBlock value={m} label="m" />
      <span className="text-white/40 text-sm leading-none -mt-2">:</span>
      <TimeBlock value={s} label="s" />
    </div>
  );
};

/* ── Individual banner slides ── */

const OfferBanner7Day = ({ remaining }: { remaining: number }) => (
  <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 p-4">
    <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/10" />
    <div className="absolute -bottom-3 -left-3 w-14 h-14 rounded-full bg-white/10" />
    <div className="relative flex items-center justify-between gap-3">
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-white/90 shrink-0" />
          <h3 className="text-sm font-bold text-white truncate">⏰ 25% OFF First Month</h3>
        </div>
        <p className="text-[11px] text-white/80 pl-5.5">Book before time runs out!</p>
      </div>
      <CompactTimer remaining={remaining} />
    </div>
  </div>
);

const OfferBannerExpired = () => (
  <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-gray-800 via-gray-700 to-gray-600 p-4">
    <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/5" />
    <div className="relative flex items-center gap-3">
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
          <h3 className="text-sm font-bold text-white truncate">⚠️ Offer Expired</h3>
        </div>
        <p className="text-[11px] text-white/70 pl-5.5">Your 25% first month discount has ended.</p>
      </div>
    </div>
  </div>
);

const OfferBannerLucky = ({ remaining }: { remaining: number }) => (
  <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 p-4">
    <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/10" />
    <div className="absolute -bottom-3 -left-3 w-14 h-14 rounded-full bg-white/10" />
    <div className="relative flex items-center justify-between gap-3">
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-white/90 shrink-0" />
          <h3 className="text-sm font-bold text-white truncate">🎉 25% OFF Unlocked!</h3>
        </div>
        <p className="text-[11px] text-white/80 pl-5.5">24-hour lucky deal — grab it now</p>
      </div>
      <CompactTimer remaining={remaining} />
    </div>
  </div>
);

const FreeDropBanner = () => (
  <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-indigo-500 to-cyan-500 p-4">
    <div className="absolute -top-5 -right-5 w-20 h-20 rounded-full bg-white/10" />
    <div className="absolute -bottom-3 -left-3 w-14 h-14 rounded-full bg-white/10" />
    <div className="relative flex items-center gap-3">
      <div className="shrink-0 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
        <Car className="h-5 w-5 text-white" />
      </div>
      <div className="space-y-0.5 min-w-0">
        <h3 className="text-sm font-bold text-white">🚗 Free Drop to Your Room</h3>
        <p className="text-[11px] text-white/80 leading-snug">
          Get free pickup within 15 KM when you book with Livenzo
        </p>
      </div>
    </div>
  </div>
);

/* ── Main Slider ── */

const PromoBannerSlider: React.FC = () => {
  const { offerStatus, remaining } = useOfferStatus();
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef(0);
  const autoSlideRef = useRef<ReturnType<typeof setInterval>>();

  // Build slides based on offer status
  const slides: React.ReactNode[] = [];

  if (offerStatus === "active_7_day") {
    slides.push(<OfferBanner7Day key="7day" remaining={remaining} />);
  } else if (offerStatus === "expired" || offerStatus === "fully_expired") {
    slides.push(<OfferBannerExpired key="expired" />);
  } else if (offerStatus === "lucky_24h") {
    slides.push(<OfferBannerLucky key="lucky" remaining={remaining} />);
  }

  // Always show Free Drop banner
  slides.push(<FreeDropBanner key="freedrop" />);

  const slideCount = slides.length;

  // Reset index when slides change
  useEffect(() => {
    setActiveIndex(0);
  }, [offerStatus]);

  // Auto-slide
  const startAutoSlide = useCallback(() => {
    if (autoSlideRef.current) clearInterval(autoSlideRef.current);
    if (slideCount <= 1) return;
    autoSlideRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slideCount);
    }, 6000);
  }, [slideCount]);

  useEffect(() => {
    startAutoSlide();
    return () => {
      if (autoSlideRef.current) clearInterval(autoSlideRef.current);
    };
  }, [startAutoSlide]);

  // Touch/swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (slideCount <= 1) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      setActiveIndex((prev) => (diff > 0 ? (prev + 1) % slideCount : (prev - 1 + slideCount) % slideCount));
      startAutoSlide(); // Reset timer after manual swipe
    }
  };

  if (slideCount === 0) return null;

  return (
    <div className="mb-4 animate-fade-in">
      <div
        className="relative overflow-hidden rounded-xl shadow-lg"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {slides.map((slide, i) => (
            <div key={i} className="w-full shrink-0">
              {slide}
            </div>
          ))}
        </div>
      </div>

      {/* Dots */}
      {slideCount > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setActiveIndex(i);
                startAutoSlide();
              }}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === activeIndex ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/30",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PromoBannerSlider;
