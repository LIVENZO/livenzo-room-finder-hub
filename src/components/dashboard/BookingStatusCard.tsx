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

  const isConfirmed = booking.booking_stage === 'confirmed' && booking.token_paid;
  const isPending = !booking.token_paid;
  const dropDate = booking.drop_date ? parseISO(booking.drop_date) : null;
  const isDropPassed = dropDate ? isPast(dropDate) : false;
  const daysLeft = dropDate ? differenceInDays(dropDate, new Date()) : null;

  // Backend confirmed (approved + token_paid) — hide card
  if (booking.status === 'approved' && booking.booking_stage === 'confirmed') {
    return null;
  }

  // Room locked, drop date in future — countdown
  if (isConfirmed && dropDate && !isDropPassed && daysLeft !== null) {
    return (
      <Card className="border-0 shadow-soft bg-gradient-to-br from-green-50 to-emerald-50 overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="font-semibold text-green-900">Your Room is Secured! 🏠</h3>
              <p className="text-sm text-green-700">
                {room?.title || 'Your room'} is locked and waiting for you.
              </p>
              <div className="flex items-center gap-2 mt-3 bg-white/60 rounded-lg p-3">
                <span className="text-2xl">🚗</span>
                <div>
                  <p className="text-lg font-bold text-green-900">
                    {daysLeft === 0 ? "Today's the day!" : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left to shift`}
                  </p>
                  <p className="text-xs text-green-600">Looking forward to your shift!</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Room locked but drop date has passed — change schedule
  if (isConfirmed && dropDate && isDropPassed) {
    return (
      <Card className="border-0 shadow-soft bg-gradient-to-br from-amber-50 to-orange-50 overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold text-amber-900">Shift Date Passed</h3>
              <p className="text-sm text-amber-700">
                Your scheduled drop date has passed. Update your shift schedule to continue.
              </p>
              <Button
                className="w-full mt-2"
                variant="outline"
                onClick={() => navigate(`/room/${booking.room_id}`)}
              >
                <CalendarCheck className="h-4 w-4 mr-2" />
                Change Shift Schedule
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Payment not completed — pay now reminder
  if (isPending) {
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
  }

  return null;
};

export default BookingStatusCard;
