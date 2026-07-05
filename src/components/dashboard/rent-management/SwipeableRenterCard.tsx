import React, { useState, useRef } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, Camera, Download, User, History, Zap, Home, Plus, CalendarDays, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MeterPhoto } from './ActiveRentersList';
import { MeterPhotoViewModal } from '@/components/owner/MeterPhotoViewModal';
import { MeterPhotoDetailModal } from '@/components/owner/MeterPhotoDetailModal';
import PaymentHistoryModal from './PaymentHistoryModal';
import SetElectricityBillModal from './SetElectricityBillModal';

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
  securityDeposit?: number;
  maintenanceAmount?: number;
  electricityBillAmount?: number | null;
}

interface SwipeableRenterCardProps {
  renter: RenterPaymentInfo;
  index: number;
  onSwipeAction: (renterId: string, action: 'paid' | 'unpaid') => void;
  meterPhotos?: Record<string, MeterPhoto[]>;
  onAddPayment: (renterId: string, renterName: string) => void;
  isDemo?: boolean;
  ownerId: string;
  onRefresh?: () => void;
}

const SwipeableRenterCard: React.FC<SwipeableRenterCardProps> = ({
  renter,
  index,
  onSwipeAction,
  meterPhotos = {},
  onAddPayment,
  isDemo = false,
  ownerId,
  onRefresh,
}) => {
  const [showElectricityModal, setShowElectricityModal] = useState(false);
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
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-700">Paid</span>
          </div>
        );
      case 'unpaid':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-200">
            <XCircle className="h-3.5 w-3.5 text-rose-600" />
            <span className="text-xs font-bold text-rose-700">Overdue</span>
          </div>
        );
      case 'pending':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200">
            <Clock className="h-3.5 w-3.5 text-amber-600" />
            <span className="text-xs font-bold text-amber-700">Pending</span>
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted border border-border">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-bold text-muted-foreground">Unknown</span>
          </div>
        );
    }
  };

  return (
    <div 
      ref={constraintsRef}
      className="relative overflow-hidden rounded-2xl shadow-soft border border-border/30 bg-card"
    >
      {/* Background Actions */}
      <motion.div
        className="absolute inset-0 flex"
        style={{ opacity: backgroundOpacity }}
      >
        {/* Left Background - Unpaid */}
        <motion.div
          className="w-1/2 bg-red-500 flex items-center justify-start pl-6"
          style={{ opacity: leftOpacity }}
        >
          <div className="flex items-center gap-2 text-white">
            <XCircle className="h-6 w-6" />
            <span className="font-semibold">Mark Unpaid</span>
          </div>
        </motion.div>

        {/* Right Background - Paid */}
        <motion.div
          className="w-1/2 bg-green-500 flex items-center justify-end pr-6"
          style={{ opacity: rightOpacity }}
        >
          <div className="flex items-center gap-2 text-white">
            <span className="font-semibold">Mark Paid</span>
            <CheckCircle className="h-6 w-6" />
          </div>
        </motion.div>
      </motion.div>

      {/* Main Card Content */}
      <motion.div
        className={cn(
          "relative z-10 bg-card cursor-grab transition-colors",
          isDragging && "cursor-grabbing",
          !isDemo && "hover:bg-muted/20 active:bg-muted/40"
        )}
        drag="x"
        dragConstraints={constraintsRef}
        dragElastic={0.2}
        style={{ x }}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        onClick={handleTap}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        whileDrag={{ scale: 1.02 }}
        animate={{ 
          scale: isDragging ? 1.02 : 1,
          rotateZ: swipeDirection === 'left' ? -2 : swipeDirection === 'right' ? 2 : 0
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="p-5">
          {/* Header: Avatar + Identity + Status */}
          <div className="flex items-start gap-3.5">
            <Avatar className="h-12 w-12 ring-2 ring-primary/10 flex-shrink-0">
              <AvatarImage src={renter.renter.avatar_url || ''} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                {renter.renter.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'R'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground text-base leading-snug truncate">
                    {renter.renter.full_name || 'Unknown Renter'}
                  </h3>
                  {renter.renter.room_number && (
                    <div className="flex items-center gap-1 mt-0.5 text-sm text-muted-foreground">
                      <Home className="h-3.5 w-3.5 text-primary/60" />
                      <span>Room {renter.renter.room_number}</span>
                    </div>
                  )}
                </div>
                <motion.div
                  animate={{ 
                    scale: statusOverride ? [1, 1.1, 1] : 1,
                    rotateZ: statusOverride ? [0, 5, -5, 0] : 0
                  }}
                  transition={{ duration: 0.5 }}
                  className="flex-shrink-0"
                >
                  {getStatusBadge(statusOverride || renter.paymentStatus)}
                </motion.div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="my-4 border-t border-border/30" />

          {/* Financial Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Monthly Rent */}
            <div className="flex flex-col gap-1.5 bg-muted/40 rounded-xl px-4 py-3">
              <div className="flex items-center gap-1.5">
                <Home className="h-3.5 w-3.5 text-primary/70" />
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Rent</span>
              </div>
              <span className="text-lg font-bold text-foreground tracking-tight">₹{renter.amount.toLocaleString()}</span>
            </div>

            {/* Electricity Bill */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowElectricityModal(true);
              }}
              className="flex flex-col gap-1.5 bg-muted/40 hover:bg-muted/70 active:bg-muted/90 transition-colors rounded-xl px-4 py-3 text-left"
            >
              <div className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Electricity</span>
              </div>
              <span className="text-lg font-bold text-foreground tracking-tight flex items-center gap-1">
                {renter.electricityBillAmount && renter.electricityBillAmount > 0
                  ? `₹${renter.electricityBillAmount.toLocaleString()}`
                  : (
                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Plus className="h-3.5 w-3.5" />
                      Add
                    </span>
                  )
                }
              </span>
            </button>
          </div>

          {/* Due Date */}
          {renter.dueDate && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5 flex-shrink-0" />
              <span>Due <span className="font-semibold text-foreground">{new Date(renter.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span></span>
            </div>
          )}

          {/* Payment History Button */}
          <div className="mt-4">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowPaymentHistory(true);
              }}
              className="w-full flex items-center justify-between gap-2 py-3 px-4 rounded-xl bg-primary/[0.06] hover:bg-primary/[0.10] active:bg-primary/[0.14] text-primary font-semibold text-sm transition-colors"
            >
              <div className="flex items-center gap-2">
                <History className="h-4 w-4" />
                View Payment History
              </div>
              <ChevronRight className="h-4 w-4 opacity-40" />
            </button>
          </div>

          {/* Meter Photos Display */}
          {renter.relationshipId && meterPhotos[renter.relationshipId] && meterPhotos[renter.relationshipId].length > 0 && (
            <div className="mt-4 pt-3 border-t border-border/30">
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold mb-2">
                <Camera className="h-3 w-3" />
                Meter Photo Uploaded
              </div>
              <div className="flex gap-2">
                {meterPhotos[renter.relationshipId].slice(0, 2).map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.photo_url}
                      alt="Meter reading"
                      className="w-12 h-12 object-cover rounded-lg border border-border/40 cursor-pointer"
                      onClick={() => window.open(photo.photo_url, '_blank')}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <Download className="h-3 w-3 text-white" />
                    </div>
                  </div>
                ))}
                {meterPhotos[renter.relationshipId].length > 2 && (
                  <div className="w-12 h-12 bg-muted rounded-lg border border-border/40 flex items-center justify-center text-xs font-semibold text-muted-foreground">
                    +{meterPhotos[renter.relationshipId].length - 2}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Swipe Direction Indicator */}
      {isDragging && swipeDirection && (
        <motion.div
          className={cn(
            "absolute top-3 z-20 px-3 py-1 rounded-full text-white text-sm font-bold shadow-lg",
            swipeDirection === 'left' ? "left-3 bg-red-500" : "right-3 bg-emerald-500"
          )}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
        >
          {swipeDirection === 'left' ? 'Unpaid' : 'Paid'}
        </motion.div>
      )}

      {/* Meter Photo View Modal */}
      {renter.relationshipId && meterPhotos[renter.relationshipId] && (
        <MeterPhotoViewModal
          isOpen={showMeterPhotoModal}
          onClose={() => setShowMeterPhotoModal(false)}
          renterName={renter.renter.full_name || 'Unknown Renter'}
          meterPhotos={meterPhotos[renter.relationshipId]}
          electricityBillAmount={undefined} // TODO: Get from backend
        />
      )}

      {/* Meter Photo Detail Modal */}
      {renter.relationshipId && (
        <MeterPhotoDetailModal
          isOpen={showMeterPhotoDetailModal}
          onClose={() => setShowMeterPhotoDetailModal(false)}
          renterName={renter.renter.full_name || 'Unknown Renter'}
          relationshipId={renter.relationshipId}
          meterPhotos={meterPhotos[renter.relationshipId] || []}
        />
      )}

      {/* Payment History Modal */}
      {renter.relationshipId && (
        <PaymentHistoryModal
          isOpen={showPaymentHistory}
          onClose={() => setShowPaymentHistory(false)}
          renterId={renter.renter.id}
          renterName={renter.renter.full_name || 'Unknown Renter'}
          ownerId={ownerId}
          relationshipId={renter.relationshipId}
          currentAmount={renter.amount}
        />
      )}

      {/* Electricity Bill Modal (owner) */}
      {renter.relationshipId && (
        <SetElectricityBillModal
          isOpen={showElectricityModal}
          onClose={() => setShowElectricityModal(false)}
          renterId={renter.renter.id}
          ownerId={ownerId}
          relationshipId={renter.relationshipId}
          renterName={renter.renter.full_name || 'Renter'}
          currentAmount={renter.electricityBillAmount ?? null}
          onSaved={onRefresh}
        />
      )}
    </div>
  );
};

export default SwipeableRenterCard;
