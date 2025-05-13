
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createBooking } from '@/services/BookingService';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';

interface BookRoomProps {
  roomId: string;
  ownerId: string;
}

const BookRoom: React.FC<BookRoomProps> = ({ roomId, ownerId }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleBookingRequest = async () => {
    if (!user || !date) {
      toast.error("Please select a move-in date");
      return;
    }
    
    setIsSubmitting(true);
    
    const booking = {
      user_id: user.id,
      room_id: roomId,
      owner_id: ownerId,
      status: 'pending' as const,
      message: message || null,
      move_in_date: format(date, 'yyyy-MM-dd'),
    };
    
    const result = await createBooking(booking);
    
    setIsSubmitting(false);
    
    if (result) {
      setIsDialogOpen(false);
      toast.success("Booking request sent successfully!");
      // Navigate to bookings page
      navigate('/bookings');
    }
  };
  
  if (!user) {
    return (
      <Button onClick={() => navigate('/')}>Sign in to book this room</Button>
    );
  }
  
  return (
    <>
      <Button onClick={() => setIsDialogOpen(true)}>Book This Room</Button>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Book This Room</DialogTitle>
            <DialogDescription>
              Send a booking request to the room owner. Please provide your desired move-in date and a message.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">When would you like to move in?</p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Select a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Message to the owner (optional)</p>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Introduce yourself and share why you're interested in this room..."
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleBookingRequest} disabled={!date || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending Request...
                </>
              ) : (
                'Send Booking Request'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BookRoom;
