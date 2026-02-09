
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Room } from '@/types/room';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Pencil, Trash2, Eye, Loader2, Star } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import { invalidateTopRoomsCache } from '@/services/topRoomsService';

interface RoomManagementCardProps {
  room: Room;
  isUpdating: boolean;
  setUpdatingRoom: React.Dispatch<React.SetStateAction<string | null>>;
}

const RoomManagementCard: React.FC<RoomManagementCardProps> = ({ 
  room, 
  isUpdating,
  setUpdatingRoom 
}) => {
  const navigate = useNavigate();
  const [isAvailable, setIsAvailable] = useState(room.available !== false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTopRoom, setIsTopRoom] = useState(room.is_top_room ?? false);
  const [isTogglingTop, setIsTogglingTop] = useState(false);
  
  const handleAvailabilityChange = async (checked: boolean) => {
    setUpdatingRoom(room.id);
    
    try {
      // Use the dedicated function for owners to update room availability
      const { error } = await supabase.rpc('update_room_availability_for_owner', {
        room_id: room.id,
        is_available: checked
      });
      
      if (error) {
        console.error('Error updating room availability:', error);
        toast.error(`Failed to update availability: ${error.message}`);
        return;
      }
      
      setIsAvailable(checked);
      toast.success(`Room is now ${checked ? 'available' : 'unavailable'}`);
    } catch (error) {
      console.error('Error in handleAvailabilityChange:', error);
      toast.error('An error occurred while updating availability');
    } finally {
      setUpdatingRoom(null);
    }
  };
  
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return;
    }
    
    setIsDeleting(true);
    
    try {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', room.id);
      
      if (error) {
        console.error('Error deleting room:', error);
        toast.error('Failed to delete room listing');
        return;
      }
      
      toast.success('Room listing deleted successfully');
      // Room will be removed from the list when the parent component refreshes
    } catch (error) {
      console.error('Error in handleDelete:', error);
      toast.error('An error occurred while deleting the room');
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleToggleTopRoom = async (checked: boolean) => {
    setIsTogglingTop(true);
    try {
      const { error } = await supabase.rpc('toggle_top_room', {
        p_room_id: room.id,
        p_is_top: checked
      });
      if (error) {
        toast.error(`Failed to update: ${error.message}`);
        return;
      }
      setIsTopRoom(checked);
      invalidateTopRoomsCache();
      toast.success(checked ? 'Added to Top Rooms' : 'Removed from Top Rooms');
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsTogglingTop(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };
  
  return (
    <Card className="overflow-hidden">
      <div className="relative h-40 w-full">
        <img
          src={room.images[0] || '/placeholder.svg'}
          alt={room.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute top-2 right-2">
          <div className={`text-xs font-medium px-2 py-1 rounded ${
            isAvailable ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'
          }`}>
            {isAvailable ? 'Available' : 'Unavailable'}
          </div>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="font-medium">{room.title}</div>
          <p className="text-sm text-gray-500 truncate">{room.location}</p>
          <div className="text-lg font-semibold">{formatPrice(room.price)}<span className="text-sm font-normal text-gray-500">/mo</span></div>
        </div>
      </CardContent>
      
      <CardFooter className="border-t px-4 py-3 flex flex-col gap-3">
        <div className="flex items-center justify-between w-full">
          <span className="text-sm">Availability:</span>
          <Switch 
            checked={isAvailable} 
            onCheckedChange={handleAvailabilityChange}
            disabled={isUpdating}
          />
        </div>

        <div className="flex items-center justify-between w-full">
          <label htmlFor={`top-room-${room.id}`} className="text-sm flex items-center gap-1.5 cursor-pointer">
            <Star className="h-3.5 w-3.5 text-amber-500" />
            Add to Top Rooms
          </label>
          <Checkbox
            id={`top-room-${room.id}`}
            checked={isTopRoom}
            onCheckedChange={(checked) => handleToggleTopRoom(checked === true)}
            disabled={isTogglingTop}
          />
        </div>
        
        <div className="grid grid-cols-3 gap-2 w-full">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate(`/room/${room.id}`)}
          >
            <Eye className="h-3 w-3 mr-1" /> View
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate(`/edit-room/${room.id}`)}
          >
            <Pencil className="h-3 w-3 mr-1" /> Edit
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <>
                <Trash2 className="h-3 w-3 mr-1" /> Delete
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default RoomManagementCard;
