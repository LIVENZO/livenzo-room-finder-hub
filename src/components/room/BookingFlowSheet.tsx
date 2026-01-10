import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CheckCircle2, ArrowLeft, Loader2, Info, XCircle, CalendarIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Global type declaration for Razorpay
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface BookingFlowSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  userId: string;
  roomTitle: string;
  userName?: string;
  userPhone?: string;
  userEmail?: string;
}

type Step = 'user-type' | 'details' | 'duration' | 'move-in-date' | 'not-eligible' | 'token-confirm' | 'processing' | 'success' | 'failed';
type UserType = 'student' | 'professional';

const TOKEN_AMOUNT = 500; // ₹500 token amount

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
  roomTitle,
  userName = '',
  userPhone = '',
  userEmail = ''
}) => {
  const [step, setStep] = useState<Step>('user-type');
  const [userType, setUserType] = useState<UserType | null>(null);
  const [userDetails, setUserDetails] = useState('');
  const [stayDuration, setStayDuration] = useState<number | null>(null);
  const [moveInDate, setMoveInDate] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string>('');

  const resetFlow = () => {
    setStep('user-type');
    setUserType(null);
    setUserDetails('');
    setStayDuration(null);
    setMoveInDate(undefined);
    setBookingId(null);
    setPaymentError('');
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(resetFlow, 300);
  };

  const createOrUpdateBookingRequest = async (
    stage: string, 
    tokenRequired: boolean, 
    tokenPaid: boolean = false,
    status: string = 'initiated',
    razorpayPaymentId?: string
  ) => {
    try {
      if (bookingId) {
        const updateData: any = {
          user_type: userType,
          user_details: userDetails,
          stay_duration: stayDuration,
          move_in_date: moveInDate ? format(moveInDate, 'yyyy-MM-dd') : null,
          booking_stage: stage,
          token_required: tokenRequired,
          token_paid: tokenPaid,
          token_amount: TOKEN_AMOUNT,
          status
        };
        
        // Add razorpay_payment_id if payment was successful
        // Note: This field might need to be added to the table if not exists
        
        const { error } = await supabase
          .from('booking_requests')
          .update(updateData)
          .eq('id', bookingId);

        if (error) throw error;
        return bookingId;
      } else {
        const { data, error } = await supabase
          .from('booking_requests')
          .insert({
            room_id: roomId,
            user_id: userId,
            user_type: userType,
            user_details: userDetails,
            stay_duration: stayDuration,
            move_in_date: moveInDate ? format(moveInDate, 'yyyy-MM-dd') : null,
            booking_stage: stage,
            token_required: tokenRequired,
            token_paid: tokenPaid,
            token_amount: TOKEN_AMOUNT,
            status
          })
          .select('id')
          .single();

        if (error) throw error;
        if (data) {
          setBookingId(data.id);
          return data.id;
        }
      }
      return null;
    } catch (error) {
      console.error('Error with booking request:', error);
      toast.error('Something went wrong. Please try again.');
      return null;
    }
  };

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayAndLock = async () => {
    setLoading(true);
    setStep('processing');

    try {
      // Create/update booking with token_pending status
      const currentBookingId = await createOrUpdateBookingRequest('token_pending', true, false, 'initiated');
      if (!currentBookingId) {
        throw new Error('Failed to create booking');
      }

      // Get authentication token
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) {
        throw new Error('Authentication required. Please log in again.');
      }

      // Create token payment order (NO relationship required)
      const { data: orderData, error: orderError } = await supabase.functions.invoke('create-token-payment', {
        body: {
          action: 'create_order',
          bookingRequestId: currentBookingId,
          roomId
        },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`
        }
      });

      if (orderError) {
        console.error('Error creating token payment order:', orderError);
        throw new Error('Failed to create payment order');
      }

      if (!orderData?.success || !orderData?.razorpayOrderId) {
        console.error('Invalid response:', orderData);
        throw new Error('Invalid payment order response');
      }

      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load payment gateway');
      }

      // Open Razorpay checkout
      const options = {
        key: orderData.razorpayKeyId,
        amount: orderData.amount,
        currency: 'INR',
        name: 'Livenzo',
        description: 'Livenzo Room Booking Token',
        order_id: orderData.razorpayOrderId,
        prefill: {
          name: userName,
          email: userEmail,
          contact: userPhone
        },
        config: {
          display: {
            blocks: {
              banks: {
                name: 'Pay using UPI or other methods',
                instruments: [
                  { method: 'upi' },
                  { method: 'card' },
                  { method: 'netbanking' },
                  { method: 'wallet' }
                ]
              }
            },
            sequence: ['block.banks'],
            preferences: { show_default_blocks: false }
          }
        },
        handler: async (response: any) => {
          try {
            const { data: sessionData2 } = await supabase.auth.getSession();
            if (!sessionData2?.session?.access_token) {
              throw new Error('Authentication required. Please log in again.');
            }

            // Verify token payment and lock room server-side
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('create-token-payment', {
              body: {
                action: 'verify_payment',
                bookingRequestId: currentBookingId,
                roomId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature
              },
              headers: {
                Authorization: `Bearer ${sessionData2.session.access_token}`
              }
            });

            if (verifyError || !verifyData?.success) {
              console.error('Token payment verification failed:', verifyError, verifyData);
              await createOrUpdateBookingRequest('payment_failed', true, false, 'payment_failed');
              setPaymentError('Payment verification failed. You can retry anytime to lock this room.');
              setStep('failed');
              setLoading(false);
              return;
            }

            setStep('success');
            setLoading(false);
          } catch (error) {
            console.error('Token payment verification error:', error);
            await createOrUpdateBookingRequest('payment_failed', true, false, 'payment_failed');
            setPaymentError('Payment was not completed. You can retry anytime to lock this room.');
            setStep('failed');
            setLoading(false);
          }
        },
        modal: {
          ondismiss: async () => {
            await createOrUpdateBookingRequest('payment_failed', true, false, 'payment_cancelled');
            setPaymentError('Payment was not completed. You can retry anytime to lock this room.');
            setStep('failed');
            setLoading(false);
          }
        },
        theme: { color: '#3B82F6' }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', async (response: any) => {
        console.error('Payment failed:', response.error);
        await createOrUpdateBookingRequest('payment_failed', true, false, 'payment_failed');
        setPaymentError(response.error?.description || 'Payment was not completed. You can retry anytime to lock this room.');
        setStep('failed');
        setLoading(false);
      });
      rzp.open();

    } catch (error) {
      console.error('Payment error:', error);
      await createOrUpdateBookingRequest('payment_failed', true, false, 'payment_failed');
      setPaymentError(error instanceof Error ? error.message : 'Payment failed');
      setStep('failed');
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
    setLoading(true);

    if (stayDuration < 6) {
      await createOrUpdateBookingRequest('not_eligible', false, false, 'not_eligible');
      setStep('not-eligible');
    } else {
      setStep('move-in-date');
    }
    setLoading(false);
  };

  const handleMoveInDateContinue = async () => {
    if (!moveInDate) {
      toast.error('Please select a move-in date');
      return;
    }
    setLoading(true);
    await createOrUpdateBookingRequest('token_pending', true, false, 'initiated');
    setStep('token-confirm');
    setLoading(false);
  };

  const handleChangeDuration = () => {
    setStayDuration(null);
    setStep('duration');
  };

  const handleRetryPayment = () => {
    setPaymentError('');
    setStep('token-confirm');
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

      case 'move-in-date':
        return (
          <motion.div
            key="move-in-date"
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
              <h2 className="text-xl font-semibold text-foreground">When do you plan to shift?</h2>
              <p className="text-sm text-muted-foreground mt-1">Select your expected move-in date</p>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Move-in Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-12 justify-start text-left font-normal",
                      !moveInDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {moveInDate ? format(moveInDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={moveInDate}
                    onSelect={setMoveInDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                This helps the owner prepare the room before your arrival.
              </p>
            </div>

            <Button
              className="w-full h-12 text-base font-medium"
              onClick={handleMoveInDateContinue}
              disabled={!moveInDate || loading}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Continue'}
            </Button>
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
              onClick={() => setStep('move-in-date')}
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
                <span className="text-2xl font-bold text-foreground">₹{TOKEN_AMOUNT.toLocaleString()}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                ₹{TOKEN_AMOUNT} is refundable if owner does not approve
              </p>
            </div>

            <Button
              className="w-full h-12 text-base font-medium"
              onClick={handlePayAndLock}
              disabled={loading}
            >
              Pay & Lock Room
            </Button>
          </motion.div>
        );

      case 'processing':
        return (
          <motion.div
            key="processing"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6 text-center py-8"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 mx-auto"
            >
              <Loader2 className="h-16 w-16 text-primary" />
            </motion.div>

            <div>
              <h2 className="text-xl font-semibold text-foreground">Opening secure payment…</h2>
              <p className="text-muted-foreground mt-2">
                Please complete the payment in the Razorpay window
              </p>
            </div>
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
                Your payment was successful.
                <br />
                This room is now locked for you.
                <br />
                Our team and the owner have been notified.
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

      case 'failed':
        return (
          <motion.div
            key="failed"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center"
            >
              <XCircle className="h-10 w-10 text-red-600" />
            </motion.div>

            <div>
              <h2 className="text-xl font-semibold text-foreground">Payment Not Completed</h2>
              <p className="text-muted-foreground mt-3 leading-relaxed">
                {paymentError || 'Payment was not completed. You can retry anytime to lock this room.'}
              </p>
            </div>

            <div className="space-y-3">
              <Button
                className="w-full h-12 text-base font-medium"
                onClick={handleRetryPayment}
              >
                Retry Payment
              </Button>
              <Button
                variant="outline"
                className="w-full h-12 text-base font-medium"
                onClick={handleClose}
              >
                Close
              </Button>
            </div>
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
