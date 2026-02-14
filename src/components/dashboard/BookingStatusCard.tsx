import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarCheck, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';
import { differenceInDays, parseISO, isPast } from 'date-fns';

interface BookingData {
  id: string;
  room_id: string;
  booking_stage: string | null;
  token_paid: boolean | null;
  drop_date: string | null;
  drop_time: string | null;
  status: string;
  token_amount: number | null;
}

interface RoomData {
  title: string;
  price: number;
}

const BookingStatusCard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [room, setRoom] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchActiveBooking = async () => {
      try {
        const { data, error } = await supabase
          .from('booking_requests')
          .select('id, room_id, booking_stage, token_paid, drop_date, drop_time, status, token_amount')
          .eq('user_id', user.id)
          .in('status', ['initiated', 'approved', 'payment_cancelled', 'payment_failed'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error || !data) {
          setLoading(false);
          return;
        }

        setBooking(data as BookingData);

        // Fetch room details
        const { data: roomData } = await supabase
          .from('rooms')
          .select('title, price')
          .eq('id', data.room_id)
          .maybeSingle();

        if (roomData) setRoom(roomData);
      } catch (err) {
        console.error('Error fetching booking:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveBooking();
  }, [user]);

  if (loading || !booking) return null;

  const isPending = !booking.token_paid;
  const now = new Date();

  // Parse drop datetime with time precision
  let dropDateTime: Date | null = null;
  if (booking.drop_date) {
    const base = parseISO(booking.drop_date);
    if (booking.drop_time) {
      const [h, m] = booking.drop_time.split(':').map(Number);
      base.setHours(h, m, 0, 0);
    }
    dropDateTime = base;
  }

  const isDropPassed = dropDateTime ? isPast(dropDateTime) : false;
  const gracePeriodEnd = dropDateTime ? new Date(dropDateTime.getTime() + 24 * 60 * 60 * 1000) : null;
  const isGracePassed = gracePeriodEnd ? isPast(gracePeriodEnd) : false;

  // Backend confirmed — hide everything
  if (booking.status === 'approved' && booking.booking_stage === 'confirmed') {
    return null;
  }

  // Sub-components
  const DropBanner = () => {
    if (!dropDateTime) return null;
    const formattedDate = dropDateTime.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    const formattedTime = booking.drop_time
      ? new Date(`2000-01-01T${booking.drop_time}`).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
      : null;
    return (
      <Card className="border-0 shadow-soft bg-card overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-muted rounded-xl flex items-center justify-center shrink-0">
              <span className="text-xl">🚖</span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm text-foreground tracking-tight">Drop Scheduled</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Your room drop is planned for <span className="font-medium text-foreground">{formattedDate}</span>
                {formattedTime && <> at <span className="font-medium text-foreground">{formattedTime}</span></>}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const LockBanner = () => {
    const amount = booking.token_amount || room?.price || 0;
    return (
      <Card className="border-0 shadow-soft bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold text-blue-900">Lock Your Room</h3>
              <p className="text-sm text-blue-700">
                Don't miss out on {room?.title || 'your room'}! Complete payment of ₹{amount.toLocaleString()} to secure it.
              </p>
              <Button
                className="w-full mt-2"
                onClick={() => navigate(`/room/${booking.room_id}`)}
              >
                Pay ₹{amount.toLocaleString()} Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // --- Display Logic ---

  // Drop NOT yet passed
  if (dropDateTime && !isDropPassed) {
    return (
      <div className="space-y-4">
        <DropBanner />
        {isPending && <LockBanner />}
      </div>
    );
  }

  // Drop passed, within 24h grace — show only Lock banner
  if (isDropPassed && !isGracePassed && isPending) {
    return <LockBanner />;
  }

  // Drop passed + grace expired + unpaid — hide all
  if (isDropPassed && isGracePassed && isPending) {
    return null;
  }

  // No drop date, payment pending
  if (!dropDateTime && isPending) {
    return <LockBanner />;
  }

  return null;
};

export default BookingStatusCard;
