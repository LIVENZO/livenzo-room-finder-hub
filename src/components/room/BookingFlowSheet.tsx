import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CheckCircle2, ArrowLeft, Loader2, Info, XCircle, CalendarIcon, Clock } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  roomPrice: number;
  userName?: string;
  userPhone?: string;
  userEmail?: string;
}

type Step = 'user-type' | 'details' | 'duration' | 'not-eligible' | 'token-confirm' | 'drop-schedule' | 'drop-confirmed' | 'processing' | 'success' | 'failed';
type UserType = 'student' | 'professional';

// Token amount is now dynamic based on room rent

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
  roomPrice,
  userName = '',
  userPhone = '',
  userEmail = ''
}) => {
  const tokenAmount = roomPrice; // Dynamic: equals room rent
  const [step, setStep] = useState<Step>('token-confirm');
  const [userType, setUserType] = useState<UserType | null>(null);
  const [userDetails, setUserDetails] = useState('');
  const [stayDuration, setStayDuration] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string>('');
  const [dropDate, setDropDate] = useState<Date | undefined>(undefined);
  const [dropTime, setDropTime] = useState<string>('');

  const resetFlow = () => {
    setStep('token-confirm');
    setUserType(null);
    setUserDetails('');
    setStayDuration(null);
    setBookingId(null);
    setPaymentError('');
    setDropDate(undefined);
    setDropTime('');
  };

  // Create booking request immediately when sheet opens (triggers dashboard banner)
  useEffect(() => {
    if (open && !bookingId) {
      const createInitialBooking = async () => {
        try {
          const { data, error } = await supabase
            .from('booking_requests')
            .insert({
              room_id: roomId,
              user_id: userId,
              booking_stage: 'initiated',
              token_required: false,
              token_paid: false,
              token_amount: tokenAmount,
              status: 'initiated'
            })
            .select('id')
            .single();

          if (error) {
            console.error('Error creating initial booking:', error);
            return;
          }
          if (data) {
            setBookingId(data.id);
          }
        } catch (err) {
          console.error('Error creating initial booking:', err);
        }
      };
      createInitialBooking();
    }
  }, [open]);

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(resetFlow, 300);
  };

  const createOrUpdateBookingRequest = async (
  stage: string,
  tokenRequired: boolean,
  tokenPaid: boolean = false,
  status: string = 'initiated',
  razorpayPaymentId?: string) =>
  {
    try {
      if (bookingId) {
        const updateData: any = {
          user_type: userType,
          user_details: userDetails,
          stay_duration: stayDuration,
          booking_stage: stage,
          token_required: tokenRequired,
          token_paid: tokenPaid,
          token_amount: tokenAmount,
          status
        };

        // Add razorpay_payment_id if payment was successful
        // Note: This field might need to be added to the table if not exists

        const { error } = await supabase.
        from('booking_requests').
        update(updateData).
        eq('id', bookingId);

        if (error) throw error;
        return bookingId;
      } else {
        const { data, error } = await supabase.
        from('booking_requests').
        insert({
          room_id: roomId,
          user_id: userId,
          user_type: userType,
          user_details: userDetails,
          stay_duration: stayDuration,
          booking_stage: stage,
          token_required: tokenRequired,
          token_paid: tokenPaid,
          token_amount: tokenAmount,
          status
        }).
        select('id').
        single();

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
                { method: 'wallet' }]

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
            className="space-y-6">

            <div className="text-center">
              <h2 className="text-xl font-semibold text-foreground">Tell us about yourself</h2>
              <p className="text-sm text-muted-foreground mt-1">This helps us match you better</p>
            </div>

            <RadioGroup
              value={userType || ''}
              onValueChange={(value) => setUserType(value as UserType)}
              className="space-y-3">

              <label
                className={`flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                userType === 'student' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`
                }>

                <RadioGroupItem value="student" id="student" />
                <div className="flex-1">
                  <span className="font-medium text-foreground">🎓 Student</span>
                  <p className="text-sm text-muted-foreground">Currently studying</p>
                </div>
              </label>
              
              <label
                className={`flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                userType === 'professional' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`
                }>

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
              disabled={!userType}>

              Next
            </Button>
          </motion.div>);


      case 'details':
        return (
          <motion.div
            key="details"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6">

            <button
              onClick={() => setStep('user-type')}
              className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">

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
                className="h-12" />

            </div>

            <Button
              className="w-full h-12 text-base font-medium"
              onClick={handleDetailsNext}
              disabled={!userDetails.trim()}>

              Next
            </Button>
          </motion.div>);


      case 'duration':
        return (
          <motion.div
            key="duration"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6">

            <button
              onClick={() => setStep('details')}
              className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">

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
              className="grid grid-cols-2 gap-3">

              {[3, 6, 9, 12].map((months) =>
              <label
                key={months}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                stayDuration === months ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`
                }>

                  <RadioGroupItem value={months.toString()} className="sr-only" />
                  <span className="text-2xl font-bold text-foreground">{months}</span>
                  <span className="text-sm text-muted-foreground">months</span>
                </label>
              )}
            </RadioGroup>

            <Button
              className="w-full h-12 text-base font-medium"
              onClick={handleDurationContinue}
              disabled={!stayDuration || loading}>

              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Continue'}
            </Button>
          </motion.div>);


      case 'not-eligible':
        return (
          <motion.div
            key="not-eligible"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6 text-center">

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
                onClick={handleChangeDuration}>

                Change Duration
              </Button>
              <Button
                className="w-full h-12 text-base font-medium"
                onClick={handleClose}>

                Done
              </Button>
            </div>
          </motion.div>);


      case 'token-confirm':
        return (
          <motion.div
            key="token-confirm"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6">

            <div className="text-center space-y-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                className="text-4xl">

                🎉
              </motion.div>
              <h2 className="text-xl font-semibold text-foreground">Great Choice! Your Room is Reserved</h2>
              <p className="text-muted-foreground mt-2 leading-relaxed">

              </p>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🚗</span>
                <div>
                  <p className="font-medium text-foreground">Why Pay for Transport? Your new Room Drop is FREE</p>
                  <p className="text-sm text-muted-foreground">Free drop to your new room under 15km.

                  </p>
                </div>
              </div>
              <div className="border-t border-primary/10 pt-3 flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Booking Confirmation Fee</span>
                <span className="text-2xl font-bold text-foreground">₹{tokenAmount.toLocaleString()}</span>
              </div>
              <p className="text-xs text-muted-foreground">

              </p>
            </div>

            <Button
              className="w-full h-12 text-base font-medium"
              onClick={() => setStep('drop-schedule')}
              disabled={loading}>

              Schedule My Drop
            </Button>
          </motion.div>);


      case 'drop-schedule':
        const timeSlots = [
        '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
        '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
        '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
        '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'];

        const formatTime = (t: string) => {
          const [h, m] = t.split(':').map(Number);
          const ampm = h >= 12 ? 'PM' : 'AM';
          const hour12 = h % 12 || 12;
          return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
        };

        const handleConfirmDrop = async () => {
          if (!dropDate || !dropTime) {
            toast.error('Please select both date and time');
            return;
          }
          setLoading(true);
          try {
            const dateStr = format(dropDate, 'yyyy-MM-dd');
            if (bookingId) {
              await supabase.
              from('booking_requests').
              update({ drop_date: dateStr, drop_time: dropTime } as any).
              eq('id', bookingId);
            }
            setLoading(false);
            setStep('drop-confirmed');
          } catch (error) {
            console.error('Error saving drop schedule:', error);
            toast.error('Failed to save schedule. Please try again.');
            setLoading(false);
          }
        };

        return (
          <motion.div
            key="drop-schedule"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-5">

            <button
              onClick={() => setStep('token-confirm')}
              className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">

              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </button>

            <div className="text-center space-y-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                className="text-3xl">

                🚗
              </motion.div>
              <h2 className="text-xl font-semibold text-foreground">Schedule Your Drop</h2>
              <p className="text-sm text-muted-foreground">

              </p>
            </div>

            {/* Date Picker */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <CalendarIcon className="h-4 w-4" />
                Preferred Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-12 justify-start text-left font-normal",
                      !dropDate && "text-muted-foreground"
                    )}>

                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dropDate ? format(dropDate, "PPP") : "Select a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <Calendar
                    mode="single"
                    selected={dropDate}
                    onSelect={setDropDate}
                    disabled={(date) => date < addDays(new Date(), 1)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")} />

                </PopoverContent>
              </Popover>
            </div>

            {/* Time Picker */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                Preferred Time
              </Label>
              <Select value={dropTime} onValueChange={setDropTime}>
                <SelectTrigger className="w-full h-12">
                  <SelectValue placeholder="Select a time slot" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((slot) =>
                  <SelectItem key={slot} value={slot}>
                      {formatTime(slot)}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Summary */}
            {dropDate && dropTime &&
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">

                <p className="text-sm text-muted-foreground">Your drop is scheduled for</p>
                <p className="text-lg font-semibold text-foreground mt-1">
                  {format(dropDate, "EEE, MMM d")} at {formatTime(dropTime)}
                </p>
              </motion.div>
            }

            <Button
              className="w-full h-12 text-base font-medium"
              onClick={handleConfirmDrop}
              disabled={!dropDate || !dropTime || loading}>

              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirm Drop Schedule'}
            </Button>
          </motion.div>);


      case 'drop-confirmed':
        const formatTimeDisplay = (t: string) => {
          const [h, m] = t.split(':').map(Number);
          const ampm = h >= 12 ? 'PM' : 'AM';
          const hour12 = h % 12 || 12;
          return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
        };

        return (
          <motion.div
            key="drop-confirmed"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-5">

            {/* Celebration Banner */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 180, damping: 16 }}
              className="text-center space-y-3 py-2">

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.15 }}
                className="text-5xl">

                🎉
              </motion.div>
              <h2 className="text-xl font-bold text-foreground">Your Drop is Scheduled!</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your room is almost yours — just one step to go!
              </p>
              {dropDate && dropTime &&
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 inline-block">
                  <p className="text-sm font-semibold text-foreground">
                    🚗 {format(dropDate, "EEE, MMM d")} at {formatTimeDisplay(dropTime)}
                  </p>
                </div>
              }
            </motion.div>

            {/* Payment Card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card border border-border rounded-2xl p-5 space-y-4">

              <div className="flex items-start gap-3">
                <span className="text-2xl">🔒</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">Lock Your Room</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">Pay the booking confirmation fee to secure this room before someone else does. This amount equals your monthly rent and is fully refundable.

                  </p>
                </div>
              </div>

              <div className="border-t border-border pt-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Amount to pay</span>
                <span className="text-2xl font-bold text-foreground">₹{tokenAmount.toLocaleString()}</span>
              </div>

              <p className="text-xs text-muted-foreground">✅ Equals your monthly rent  ·  💰 Fully refundable.

              </p>
            </motion.div>

            {/* Pay Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}>

              <Button
                className="w-full h-12 text-base font-semibold"
                onClick={handlePayAndLock}
                disabled={loading}>

                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : `Pay ₹${tokenAmount.toLocaleString()} & Lock Room`}
              </Button>
            </motion.div>
          </motion.div>);


      case 'processing':
        return (
          <motion.div
            key="processing"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6 text-center py-8">

            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 mx-auto">

              <Loader2 className="h-16 w-16 text-primary" />
            </motion.div>

            <div>
              <h2 className="text-xl font-semibold text-foreground">Opening secure payment…</h2>
              <p className="text-muted-foreground mt-2">
                Please complete the payment in the Razorpay window
              </p>
            </div>
          </motion.div>);


      case 'success':
        return (
          <motion.div
            key="success"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6 text-center">

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
              className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">

              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-2">

              <h2 className="text-2xl font-semibold text-foreground">Your Room is Secured! 🎉</h2>
              <p className="text-muted-foreground leading-relaxed">
                Congratulations! Your room is now locked and waiting for you.
              </p>
              {dropDate &&
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mt-4">
                  <p className="text-sm text-muted-foreground">Your shift is scheduled for</p>
                  <p className="text-lg font-semibold text-foreground mt-1">
                    🚗 {format(dropDate, "EEE, MMM d")}{dropTime ? ` at ${(() => {const [h, m] = dropTime.split(':').map(Number);return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;})()}` : ''}
                  </p>
                  <p className="text-sm text-primary font-medium mt-2">
                    Looking forward to your shift! 🏠
                  </p>
                </div>
              }
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}>

              <Button
                className="w-full h-12 text-base font-medium"
                onClick={handleClose}>

                Go to Dashboard
              </Button>
            </motion.div>
          </motion.div>);


      case 'failed':
        return (
          <motion.div
            key="failed"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6 text-center">

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">

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
                onClick={handleRetryPayment}>

                Retry Payment
              </Button>
              <Button
                variant="outline"
                className="w-full h-12 text-base font-medium"
                onClick={handleClose}>

                Close
              </Button>
            </div>
          </motion.div>);


      default:
        return null;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl px-6 pb-8 pt-6 max-h-[85vh] overflow-y-auto">

        <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />
        
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
      </SheetContent>
    </Sheet>);

};

export default BookingFlowSheet;