import React, { useState, useRef } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Camera, Download, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MeterPhoto } from './ActiveRentersList';
import { MeterPhotoViewModal } from '@/components/owner/MeterPhotoViewModal';
import { MeterPhotoDetailModal } from '@/components/owner/MeterPhotoDetailModal';

interface RenterPaymentInfo {
  id: string;
  renter: {
    id: string;
    full_name: string;
    avatar_url?: string;
    room_number?: string;
  };
  paymentStatus: 'paid' | 'unpaid' | 'pending';
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
}

const SwipeableRenterCard: React.FC<SwipeableRenterCardProps> = ({
  renter,
  index,
  onSwipeAction,
  meterPhotos = {},
  onAddPayment,
  isDemo = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [showMeterPhotoModal, setShowMeterPhotoModal] = useState(false);
  const [showMeterPhotoDetailModal, setShowMeterPhotoDetailModal] = useState(false);
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
          <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 font-medium text-xs">
            Paid
          </Badge>
        );
      case 'unpaid':
        return <Badge variant="destructive" className="font-medium text-xs">Unpaid</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="font-medium text-xs">Pending</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Unknown</Badge>;
    }
  };

  return (
    <div 
      ref={constraintsRef}
      className={`relative overflow-hidden bg-card border-b border-border/50 ${
        index === 0 ? 'border-t border-border/50' : ''
      }`}
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
          "relative z-10 bg-card px-4 py-6 cursor-grab transition-colors",
          isDragging && "cursor-grabbing",
          !isDemo && "hover:bg-muted/30 active:bg-muted/50"
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
        <div className="flex items-center gap-4">
          {/* Left: Avatar */}
          <Avatar className="h-14 w-14 ring-2 ring-border/20 flex-shrink-0">
            <AvatarImage src={renter.renter.avatar_url || ''} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-base">
              {renter.renter.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'R'}
            </AvatarFallback>
          </Avatar>
          
          {/* Center: Renter Info */}
          <div className="flex-1 min-w-0 space-y-1">
            <h3 className="font-bold text-base text-foreground leading-tight">
              {renter.renter.full_name || 'Unknown Renter'}
            </h3>
            
            {renter.renter.room_number && (
              <p className="text-sm font-medium text-muted-foreground">
                Room {renter.renter.room_number}
              </p>
            )}
            
            <div className="flex items-center gap-2 pt-1">
              <span className="text-sm font-semibold text-foreground">
                ₹{renter.amount.toLocaleString()}
              </span>
              <motion.div
                animate={{ 
                  scale: statusOverride ? [1, 1.1, 1] : 1,
                  rotateZ: statusOverride ? [0, 5, -5, 0] : 0
                }}
                transition={{ duration: 0.5 }}
              >
                {getStatusBadge(statusOverride || renter.paymentStatus)}
              </motion.div>
            </div>
            
            {/* Due Date Display */}
            {renter.dueDate && (
              <p className="text-xs text-muted-foreground mt-1">
                Due: {new Date(renter.dueDate).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </p>
            )}

            {/* Meter Photos Display */}
            {renter.relationshipId && meterPhotos[renter.relationshipId] && meterPhotos[renter.relationshipId].length > 0 && (
              <div className="pt-2">
                <div className="flex items-center gap-1 text-xs text-green-600 font-medium mb-1">
                  <Camera className="h-3 w-3" />
                  Meter Photo Uploaded
                </div>
                <div className="flex gap-2">
                  {meterPhotos[renter.relationshipId].slice(0, 2).map((photo) => (
                    <div key={photo.id} className="relative group">
                      <img
                        src={photo.photo_url}
                        alt="Meter reading"
                        className="w-12 h-12 object-cover rounded border cursor-pointer"
                        onClick={() => window.open(photo.photo_url, '_blank')}
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                        <Download className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  ))}
                  {meterPhotos[renter.relationshipId].length > 2 && (
                    <div className="w-12 h-12 bg-muted rounded border flex items-center justify-center text-xs font-medium text-muted-foreground">
                      +{meterPhotos[renter.relationshipId].length - 2}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Right: Status Icon */}
          <div className="flex-shrink-0 flex items-center">
            <motion.div
              animate={{ 
                scale: statusOverride ? [1, 1.2, 1] : 1,
                rotateY: statusOverride ? [0, 180, 360] : 0
              }}
              transition={{ duration: 0.6 }}
            >
              {getStatusIcon(statusOverride || renter.paymentStatus)}
            </motion.div>
            {isProcessing && (
              <motion.div
                className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full"
                animate={{ scale: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 1 }}
              />
            )}
          </div>
        </div>
      </motion.div>

      {/* Swipe Direction Indicator */}
      {isDragging && swipeDirection && (
        <motion.div
          className={cn(
            "absolute top-2 z-20 px-3 py-1 rounded-full text-white text-sm font-semibold",
            swipeDirection === 'left' ? "left-2 bg-red-500" : "right-2 bg-green-500"
          )}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
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
    </div>
  );
};

export default SwipeableRenterCard;