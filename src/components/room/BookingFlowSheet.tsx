import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CheckCircle2, ArrowLeft, Loader2, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BookingFlowSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  userId: string;
  roomTitle: string;
}

type Step = 'user-type' | 'details' | 'duration' | 'not-eligible' | 'token-confirm' | 'success';
type UserType = 'student' | 'professional';

const stepVariants = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 }
};

const BookingFlowSheet: React.FC<BookingFlowSheetProps> = ({
  open,
  onOpenChange,
  roomId,
  userId,
  roomTitle
}) => {
  const [step, setStep] = useState<Step>('user-type');
  const [userType, setUserType] = useState<UserType | null>(null);
  const [userDetails, setUserDetails] = useState('');
  const [stayDuration, setStayDuration] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const resetFlow = () => {
    setStep('user-type');
    setUserType(null);
    setUserDetails('');
    setStayDuration(null);
    setBookingId(null);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(resetFlow, 300);
  };

  const createBookingRequest = async (stage: string, tokenRequired: boolean, tokenPaid: boolean = false) => {
    setLoading(true);
    try {
      if (bookingId) {
        // Update existing booking
        const { error } = await supabase
          .from('booking_requests')
          .update({
            user_type: userType,
            user_details: userDetails,
            stay_duration: stayDuration,
            booking_stage: stage,
            token_required: tokenRequired,
            token_paid: tokenPaid,
            status: tokenPaid ? 'pending' : 'initiated'
          })
          .eq('id', bookingId);

        if (error) throw error;
      } else {
        // Create new booking
        const { data, error } = await supabase
          .from('booking_requests')
          .insert({
            room_id: roomId,
            user_id: userId,
            user_type: userType,
            user_details: userDetails,
            stay_duration: stayDuration,
            booking_stage: stage,
            token_required: tokenRequired,
            token_paid: tokenPaid,
            status: 'initiated'
          })
          .select('id')
          .single();

        if (error) throw error;
        if (data) setBookingId(data.id);
      }
      return true;
    } catch (error) {
      console.error('Error with booking request:', error);
      toast.error('Something went wrong. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleUserTypeNext = () => {
    if (!userType) {
      toast.error('Please select an option');
      return;
    }
    setStep('details');
  };

  const handleDetailsNext = () => {
    if (!userDetails.trim()) {
      toast.error('Please fill in the details');
      return;
    }
    setStep('duration');
  };

  const handleDurationContinue = async () => {
    if (!stayDuration) {
      toast.error('Please select a duration');
      return;
    }

    if (stayDuration < 6) {
      await createBookingRequest('not_eligible', false);
      setStep('not-eligible');
    } else {
      await createBookingRequest('token_pending', true);
      setStep('token-confirm');
    }
  };

  const handleChangeDuration = () => {
    setStayDuration(null);
    setStep('duration');
  };

  const handlePayAndLock = async () => {
    // Simulate payment (in real app, integrate payment gateway)
    setLoading(true);
    
    // Simulate payment delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const success = await createBookingRequest('token_paid', true, true);
    if (success) {
      setStep('success');
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'user-type':
        return (
          <motion.div
            key="user-type"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-xl font-semibold text-foreground">Tell us about yourself</h2>
              <p className="text-sm text-muted-foreground mt-1">This helps us match you better</p>
            </div>

            <RadioGroup
              value={userType || ''}
              onValueChange={(value) => setUserType(value as UserType)}
              className="space-y-3"
            >
              <label
                className={`flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  userType === 'student' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
              >
                <RadioGroupItem value="student" id="student" />
                <div className="flex-1">
                  <span className="font-medium text-foreground">🎓 Student</span>
                  <p className="text-sm text-muted-foreground">Currently studying</p>
                </div>
              </label>
              
              <label
                className={`flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  userType === 'professional' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
              >
                <RadioGroupItem value="professional" id="professional" />
                <div className="flex-1">
                  <span className="font-medium text-foreground">💼 Working Professional</span>
                  <p className="text-sm text-muted-foreground">Currently employed</p>
                </div>
              </label>
            </RadioGroup>

            <Button
              className="w-full h-12 text-base font-medium"
              onClick={handleUserTypeNext}
              disabled={!userType}
            >
              Next
            </Button>
          </motion.div>
        );

      case 'details':
        return (
          <motion.div
            key="details"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
            <button
              onClick={() => setStep('user-type')}
              className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </button>

            <div className="text-center">
              <h2 className="text-xl font-semibold text-foreground">
                {userType === 'student' ? 'Your Education' : 'Your Work'}
              </h2>
            </div>

            <div className="space-y-2">
              <Label htmlFor="details" className="text-foreground">
                {userType === 'student' ? 'Which class or course are you studying?' : 'Your job role'}
              </Label>
              <Input
                id="details"
                placeholder={userType === 'student' ? 'e.g., B.Tech 3rd Year, MBA' : 'e.g., Software Engineer, Teacher'}
                value={userDetails}
                onChange={(e) => setUserDetails(e.target.value)}
                className="h-12"
              />
            </div>

            <Button
              className="w-full h-12 text-base font-medium"
              onClick={handleDetailsNext}
              disabled={!userDetails.trim()}
            >
              Next
            </Button>
          </motion.div>
        );

      case 'duration':
        return (
          <motion.div
            key="duration"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
            <button
              onClick={() => setStep('details')}
              className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </button>

            <div className="text-center">
              <h2 className="text-xl font-semibold text-foreground">How long do you plan to stay?</h2>
              <p className="text-sm text-muted-foreground mt-1">Select your preferred duration</p>
            </div>

            <RadioGroup
              value={stayDuration?.toString() || ''}
              onValueChange={(value) => setStayDuration(parseInt(value))}
              className="grid grid-cols-2 gap-3"
            >
              {[3, 6, 9, 12].map((months) => (
                <label
                  key={months}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    stayDuration === months ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <RadioGroupItem value={months.toString()} className="sr-only" />
                  <span className="text-2xl font-bold text-foreground">{months}</span>
                  <span className="text-sm text-muted-foreground">months</span>
                </label>
              ))}
            </RadioGroup>

            <Button
              className="w-full h-12 text-base font-medium"
              onClick={handleDurationContinue}
              disabled={!stayDuration || loading}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Continue'}
            </Button>
          </motion.div>
        );

      case 'not-eligible':
        return (
          <motion.div
            key="not-eligible"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6 text-center"
          >
            <div className="w-16 h-16 mx-auto bg-amber-100 rounded-full flex items-center justify-center">
              <Info className="h-8 w-8 text-amber-600" />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-foreground">Minimum Stay Required</h2>
              <p className="text-muted-foreground mt-3 leading-relaxed">
                Minimum stay for this room is <strong>6 months</strong>.
                <br />
                You can update your duration or explore other rooms.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full h-12 text-base font-medium"
                onClick={handleChangeDuration}
              >
                Change Duration
              </Button>
              <Button
                className="w-full h-12 text-base font-medium"
                onClick={handleClose}
              >
                Done
              </Button>
            </div>
          </motion.div>
        );

      case 'token-confirm':
        return (
          <motion.div
            key="token-confirm"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
            <button
              onClick={() => setStep('duration')}
              className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </button>

            <div className="text-center">
              <h2 className="text-xl font-semibold text-foreground">Lock this room</h2>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                Pay a refundable token amount to lock this room. This helps us confirm serious bookings and notify the owner faster.
              </p>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Token Amount</span>
                <span className="text-2xl font-bold text-foreground">₹500</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Refunded if owner does not approve
              </p>
            </div>

            <Button
              className="w-full h-12 text-base font-medium"
              onClick={handlePayAndLock}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                'Pay & Lock Room'
              )}
            </Button>
          </motion.div>
        );

      case 'success':
        return (
          <motion.div
            key="success"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
              className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center"
            >
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-2xl font-semibold text-foreground">Room Locked 🎉</h2>
              <p className="text-muted-foreground mt-3 leading-relaxed">
                Your booking request has been sent to the owner.
                <br />
                We'll notify you once it's approved.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Button
                className="w-full h-12 text-base font-medium"
                onClick={handleClose}
              >
                Done
              </Button>
            </motion.div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl px-6 pb-8 pt-6 max-h-[85vh] overflow-y-auto"
      >
        <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />
        
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
      </SheetContent>
    </Sheet>
  );
};

export default BookingFlowSheet;
