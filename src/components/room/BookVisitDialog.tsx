import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Room } from '@/types/room';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { CalendarIcon, Clock } from 'lucide-react';

/**
 * Shared visit-booking flow used by both the "Book a Visit" (sticky bar)
 * and "Offline Visit" (action card) buttons so behavior stays identical.
 */
export const useBookVisit = (room: Room) => {
  const [visitDialogOpen, setVisitDialogOpen] = useState(false);
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('');

  const openVisitDialog = () => setVisitDialogOpen(true);

  const handleConfirmVisit = () => {
    if (!visitDate || !visitTime) {
      toast.error('Please select a date and time for your visit');
      return;
    }

    const hostelName = room.house_name || room.title || 'This property';
    const houseNumber = room.house_no || '';
    const propertyLine = houseNumber ? `${hostelName} - ${houseNumber}` : hostelName;

    const message = `Hi Livenzo,\n\nI'd like to book a visit for:\n🏠 ${propertyLine}\n\n📅 Date: ${visitDate}\n🕒 Time: ${visitTime}\n\nPlease confirm if this slot is available. Thank you!`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/917488698970?text=${encodedMessage}`, '_blank');
    setVisitDialogOpen(false);
  };

  const visitDialog = (
    <Dialog open={visitDialogOpen} onOpenChange={setVisitDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Your Visit</DialogTitle>
          <DialogDescription>
            Pick a date and time for your visit to this property.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="visit-date" className="text-sm font-medium flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              Visit Date
            </label>
            <input
              id="visit-date"
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="visit-time" className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Visit Time
            </label>
            <input
              id="visit-time"
              type="time"
              value={visitTime}
              onChange={(e) => setVisitTime(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setVisitDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirmVisit}>
            Confirm & Open WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return { openVisitDialog, visitDialog };
};
