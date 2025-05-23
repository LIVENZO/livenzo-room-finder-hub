
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { createBooking } from '@/services/BookingService';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Room } from '@/types/room';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { useNavigate } from 'react-router-dom';

interface BookRoomProps {
  room: Room;
  onSuccess?: () => void;
}

const BookRoom: React.FC<BookRoomProps> = ({ room, onSuccess }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isComplete } = useProfileCompletion();
  
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please login to book a room');
      return;
    }
    
    if (!isComplete) {
      toast.error('Please complete your profile before booking a room');
      setOpen(false);
      navigate('/profile');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const booking = await createBooking({
        user_id: user.id,
        room_id: room.id,
        owner_id: room.ownerId,
        status: 'pending',
        message: message || null,
        move_in_date: date ? format(date, 'yyyy-MM-dd') : null
      });
      
      if (booking) {
        toast.success('Booking request sent successfully');
        setOpen(false);
        setMessage('');
        setDate(undefined);
        
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error('Error booking room:', error);
      toast.error('Failed to send booking request');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">Book this Room</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request to Book Room</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="move-in-date" className="text-sm font-medium">
              Desired Move-in Date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="move-in-date"
                  variant={'outline'}
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="grid gap-2">
            <label htmlFor="message" className="text-sm font-medium">
              Message to Owner (Optional)
            </label>
            <Textarea
              id="message"
              placeholder="Tell the owner why you're interested in this room..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Request'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BookRoom;
