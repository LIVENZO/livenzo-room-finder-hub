import React, { useState, useRef } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, Camera, Download, User, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MeterPhoto } from './ActiveRentersList';
import { MeterPhotoViewModal } from '@/components/owner/MeterPhotoViewModal';
import { MeterPhotoDetailModal } from '@/components/owner/MeterPhotoDetailModal';
import PaymentHistoryModal from './PaymentHistoryModal';
interface RenterPaymentInfo {
  id: string;
  renter: {
    id: string;
    full_name: string;
    avatar_url?: string;
    room_number?: string;
  };
  paymentStatus: 'paid' | 'unpaid' | 'pending';
  status: 'paid' | 'unpaid' | 'pending'; // Same as paymentStatus for consistency
  amount: number;
  dueDate?: string;
  lastPaymentDate?: string;
  relationshipId?: string;
  meterPhotos?: MeterPhoto[];
}
interface SwipeableRenterCardProps {
  renter: RenterPaymentInfo;
  index: number;
  onSwipeAction: (renterId: string, action: 'paid' | 'unpaid') => void;
  meterPhotos?: Record<string, MeterPhoto[]>;
  onAddPayment: (renterId: string, renterName: string) => void;
  isDemo?: boolean;
  ownerId: string;
}
const SwipeableRenterCard: React.FC<SwipeableRenterCardProps> = ({
  renter,
  index,
  onSwipeAction,
  meterPhotos = {},
  onAddPayment,
  isDemo = false,
  ownerId
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [showMeterPhotoModal, setShowMeterPhotoModal] = useState(false);
  const [showMeterPhotoDetailModal, setShowMeterPhotoDetailModal] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [tapCount, setTapCount] = useState(0);
  const [tapTimer, setTapTimer] = useState<NodeJS.Timeout | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusOverride, setStatusOverride] = useState<'paid' | 'unpaid' | null>(null);
  const x = useMotionValue(0);
  const constraintsRef = useRef(null);

  // Transform for background opacity and color
  const backgroundOpacity = useTransform(x, [-200, -50, 50, 200], [1, 0.3, 0.3, 1]);
  const leftOpacity = useTransform(x, [-200, -50], [1, 0]);
  const rightOpacity = useTransform(x, [50, 200], [0, 1]);
  const handleDragStart = () => {
    setIsDragging(true);
  };
  const handleDrag = (event: Event, info: PanInfo) => {
    const offset = info.offset.x;
    if (Math.abs(offset) > 50) {
      setSwipeDirection(offset > 0 ? 'right' : 'left');
    } else {
      setSwipeDirection(null);
    }
  };
  const handleDragEnd = async (event: Event, info: PanInfo) => {
    setIsDragging(false);
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    // Clear long press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    // Determine if swipe was strong enough
    const shouldTrigger = Math.abs(offset) > 100 || Math.abs(velocity) > 500;
    if (shouldTrigger && !isDemo && !isProcessing) {
      setIsProcessing(true);
      const newStatus = offset > 0 ? 'paid' : 'unpaid';

      // Immediately update UI for smooth experience
      setStatusOverride(newStatus);
      try {
        // Animate the card with success feedback
        await new Promise(resolve => {
          x.set(offset > 0 ? 150 : -150);
          setTimeout(resolve, 200);
        });

        // Call the swipe action
        await onSwipeAction(renter.id, newStatus);

        // Reset position smoothly
        x.set(0);

        // Clear status override after animation
        setTimeout(() => {
          setStatusOverride(null);
          setIsProcessing(false);
        }, 1000);
      } catch (error) {
        // Reset on error
        setStatusOverride(null);
        setIsProcessing(false);
        x.set(0);
      }
    } else {
      // Reset position if swipe wasn't strong enough
      x.set(0);
    }

    // Reset swipe direction
    setSwipeDirection(null);
  };
  const handleDoubleTap = () => {
    if (renter.relationshipId) {
      setShowMeterPhotoDetailModal(true);
    }
  };
  const handleTap = () => {
    if (isDragging) return; // Don't handle taps during dragging

    setTapCount(prev => prev + 1);
    if (tapTimer) {
      clearTimeout(tapTimer);
    }
    const timer = setTimeout(() => {
      if (tapCount === 1) {
        // Single tap - show long press modal if meter photos exist
        if (renter.relationshipId && meterPhotos[renter.relationshipId]?.length > 0) {
          setShowMeterPhotoModal(true);
        }
      }
      setTapCount(0);
    }, 300); // 300ms window for double tap

    setTapTimer(timer);

    // Check for double tap
    if (tapCount === 1) {
      clearTimeout(timer);
      setTapCount(0);
      handleDoubleTap();
    }
  };
  const handleMouseDown = () => {
    // No longer needed for long press, keeping for compatibility
  };
  const handleMouseUp = () => {
    // No longer needed for long press, keeping for compatibility
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'unpaid':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 font-medium text-xs">
            Paid
          </Badge>;
      case 'unpaid':
        return <Badge variant="destructive" className="font-medium text-xs">Unpaid</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="font-medium text-xs">Pending</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Unknown</Badge>;
    }
  };
  return <div ref={constraintsRef} className={`relative overflow-hidden bg-card border-b border-border/50 ${index === 0 ? 'border-t border-border/50' : ''}`}>
      {/* Background Actions */}
      <motion.div className="absolute inset-0 flex" style={{
      opacity: backgroundOpacity
    }}>
        {/* Left Background - Unpaid */}
        <motion.div className="w-1/2 bg-red-500 flex items-center justify-start pl-6" style={{
        opacity: leftOpacity
      }}>
          <div className="flex items-center gap-2 text-white">
            <XCircle className="h-6 w-6" />
            <span className="font-semibold">Mark Unpaid</span>
          </div>
        </motion.div>

        {/* Right Background - Paid */}
        <motion.div className="w-1/2 bg-green-500 flex items-center justify-end pr-6" style={{
        opacity: rightOpacity
      }}>
          <div className="flex items-center gap-2 text-white">
            <span className="font-semibold">Mark Paid</span>
            <CheckCircle className="h-6 w-6" />
          </div>
        </motion.div>
      </motion.div>

      {/* Main Card Content */}
      

      {/* Swipe Direction Indicator */}
      {isDragging && swipeDirection && <motion.div className={cn("absolute top-2 z-20 px-3 py-1 rounded-full text-white text-sm font-semibold", swipeDirection === 'left' ? "left-2 bg-red-500" : "right-2 bg-green-500")} initial={{
      scale: 0
    }} animate={{
      scale: 1
    }} exit={{
      scale: 0
    }}>
          {swipeDirection === 'left' ? 'Unpaid' : 'Paid'}
        </motion.div>}

      {/* Meter Photo View Modal */}
      {renter.relationshipId && meterPhotos[renter.relationshipId] && <MeterPhotoViewModal isOpen={showMeterPhotoModal} onClose={() => setShowMeterPhotoModal(false)} renterName={renter.renter.full_name || 'Unknown Renter'} meterPhotos={meterPhotos[renter.relationshipId]} electricityBillAmount={undefined} // TODO: Get from backend
    />}

      {/* Meter Photo Detail Modal */}
      {renter.relationshipId && <MeterPhotoDetailModal isOpen={showMeterPhotoDetailModal} onClose={() => setShowMeterPhotoDetailModal(false)} renterName={renter.renter.full_name || 'Unknown Renter'} relationshipId={renter.relationshipId} meterPhotos={meterPhotos[renter.relationshipId] || []} />}

      {/* Payment History Modal */}
      {renter.relationshipId && <PaymentHistoryModal isOpen={showPaymentHistory} onClose={() => setShowPaymentHistory(false)} renterId={renter.renter.id} renterName={renter.renter.full_name || 'Unknown Renter'} ownerId={ownerId} relationshipId={renter.relationshipId} currentAmount={renter.amount} />}
    </div>;
};
export default SwipeableRenterCard;