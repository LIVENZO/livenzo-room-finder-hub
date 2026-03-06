import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Percent, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface OfferDetail {
  title: string;
  subtitle: string;
  description: string;
}

const offers: [OfferDetail, OfferDetail] = [
  {
    title: 'Get Flat 25% OFF',
    subtitle: 'On Your First Booking',
    description:
      'Book your first room through Livenzo and get a flat 25% discount on your first month\'s rent. Valid for new users only. Terms & conditions apply.',
  },
  {
    title: 'Enjoy Free Drop',
    subtitle: 'To Your Accommodation',
    description:
      'When you book through Livenzo, we'll arrange a free drop to your accommodation from major arrival points in the city. Available for bookings above ₹3,000/month.',
  },
];

const PromotionalBanner: React.FC = () => {
  const [selectedOffer, setSelectedOffer] = useState<OfferDetail | null>(null);

  return (
    <>
      <div
        className="rounded-2xl p-3 sm:p-4 flex gap-3 sm:gap-4 mt-3 mx-0"
        style={{ backgroundColor: '#EAF2FF', boxShadow: '0 2px 12px rgba(79,123,255,0.08)' }}
      >
        {/* Card 1 */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setSelectedOffer(offers[0])}
          className="flex-1 rounded-xl p-3 sm:p-4 text-left transition-colors"
          style={{ backgroundColor: '#F5F8FF' }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Percent className="h-4 w-4 shrink-0" style={{ color: '#4F7BFF' }} />
            <span className="font-bold text-sm sm:text-base leading-tight" style={{ color: '#1A1A1A' }}>
              Get Flat 25% OFF
            </span>
          </div>
          <span className="text-xs sm:text-sm leading-tight" style={{ color: '#555' }}>
            On Your First Booking
          </span>
        </motion.button>

        {/* Card 2 */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setSelectedOffer(offers[1])}
          className="flex-1 rounded-xl p-3 sm:p-4 text-left transition-colors"
          style={{ backgroundColor: '#F5F8FF' }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-base shrink-0">🚗</span>
            <span className="font-bold text-sm sm:text-base leading-tight" style={{ color: '#1A1A1A' }}>
              Enjoy Free Drop
            </span>
          </div>
          <span className="text-xs sm:text-sm leading-tight" style={{ color: '#555' }}>
            To Your Accommodation
          </span>
        </motion.button>
      </div>

      {/* Offer Detail Dialog */}
      <Dialog open={!!selectedOffer} onOpenChange={() => setSelectedOffer(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedOffer?.title}</DialogTitle>
            <DialogDescription>{selectedOffer?.subtitle}</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {selectedOffer?.description}
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PromotionalBanner;
