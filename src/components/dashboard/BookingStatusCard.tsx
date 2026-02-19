import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';
import { parseISO, isPast } from 'date-fns';
import BookingFlowSheet from '@/components/room/BookingFlowSheet';

interface BookingData {
  id: string;
  room_id: string;
  booking_stage: string | null;
  token_paid: boolean | null;
  drop_date: string | null;
  drop_time: string | null;
  status: string;
  token_amount: number | null;
  created_at: string;
}

interface RoomData {
  title: string;
  price: number;
}

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

const BookingStatusCard: React.FC = () => {
  const { user } = useAuth();
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [room, setRoom] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchActiveBooking = async () => {
      try {
        const { data, error } = await supabase
          .from('booking_requests')
          .select('id, room_id, booking_stage, token_paid, drop_date, drop_time, status, token_amount, created_at')
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

  if (loading || !booking || !user) return null;

  const isPending = !booking.token_paid;

  // Backend confirmed — hide everything
  if (booking.status === 'approved' && booking.booking_stage === 'confirmed') {
    return null;
  }

  if (!isPending) return null;

  // Parse drop datetime
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
  const hasValidDrop = dropDateTime && !isDropPassed;

  // 24h from booking creation
  const bookingCreatedAt = parseISO(booking.created_at);
  const creationGraceEnd = new Date(bookingCreatedAt.getTime() + TWENTY_FOUR_HOURS);
  const isWithinCreationGrace = !isPast(creationGraceEnd);

  // 24h grace after drop expires
  const dropGraceEnd = dropDateTime ? new Date(dropDateTime.getTime() + TWENTY_FOUR_HOURS) : null;
  const isWithinDropGrace = dropGraceEnd ? !isPast(dropGraceEnd) : false;

  // Show "Booking In Progress" if:
  // - Within 24h of creation, OR
  // - Drop exists and hasn't expired, OR
  // - Drop expired but within 24h grace
  const showBookingBanner = isWithinCreationGrace || hasValidDrop || (isDropPassed && isWithinDropGrace);

  if (!showBookingBanner) return null;

  const amount = booking.token_amount || room?.price || 0;

  // Determine which step to open in the booking flow
  // Valid drop → go to payment (drop-confirmed), no valid drop → schedule first
  const sheetInitialStep = hasValidDrop ? 'drop-confirmed' : 'drop-schedule';

  return (
    <>
      <Card className="border-0 shadow-soft bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold text-blue-900">Booking In Progress</h3>
              <p className="text-sm text-blue-700">
                Don't miss out!<br />Complete payment of ₹{amount.toLocaleString()} to secure it.
              </p>
              <Button
                className="w-full mt-2"
                onClick={() => setSheetOpen(true)}
              >
                Pay ₹{amount.toLocaleString()} Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <BookingFlowSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        roomId={booking.room_id}
        userId={user.id}
        roomTitle={room?.title || ''}
        roomPrice={room?.price || 0}
        userName={user.user_metadata?.full_name || user.user_metadata?.name || ''}
        userPhone={user.phone || user.user_metadata?.phone || ''}
        userEmail={user.email || ''}
        initialStep={sheetInitialStep as any}
        existingBookingId={booking.id}
      />
    </>
  );
};

export default BookingStatusCard;
