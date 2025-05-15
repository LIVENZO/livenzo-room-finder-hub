
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Room } from '@/types/room';

export const fetchRooms = async (): Promise<Room[]> => {
  try {
    console.log('Fetching rooms...');
    const { data, error } = await supabase
      .from('rooms')
      .select('*');
    
    if (error) {
      console.error('Error fetching rooms:', error);
      toast.error('Failed to fetch rooms');
      return [];
    } else {
      console.log('Rooms fetched:', data);
      if (data) {
        // Map Supabase data to Room interface
        return data.map((room: any) => ({
          id: room.id,
          title: room.title,
          description: room.description,
          images: room.images || [],
          price: room.price,
          location: room.location,
          facilities: room.facilities ? {
            wifi: Boolean(room.facilities.wifi),
            bathroom: Boolean(room.facilities.bathroom),
            gender: room.facilities.gender as 'male' | 'female' | 'any',
            roomType: room.facilities.roomType as 'single' | 'sharing'
          } : {},
          ownerId: room.owner_id,
          ownerPhone: room.owner_phone,
          available: room.available,
          createdAt: room.created_at
        }));
      }
      return [];
    }
  } catch (error) {
    console.error('Error fetching rooms:', error);
    toast.error('Failed to fetch rooms');
    return [];
  }
};

export const addRoomService = async (room: Omit<Room, 'id' | 'createdAt'>): Promise<Room | null> => {
  try {
    const roomData = {
      title: room.title,
      description: room.description,
      images: room.images,
      price: room.price,
      location: room.location,
      facilities: room.facilities,
      owner_id: room.ownerId,
      owner_phone: room.ownerPhone,
      available: true
    };
    
    const { data, error } = await supabase
      .from('rooms')
      .insert(roomData)
      .select()
      .single();
    
    if (error) {
      console.error('Error adding room:', error);
      toast.error('Failed to list room');
      return null;
    } else if (data) {
      // Convert the returned data to our Room interface
      return {
        id: data.id,
        title: data.title,
        description: data.description,
        images: data.images || [],
        price: data.price,
        location: data.location,
        facilities: data.facilities,
        ownerId: data.owner_id,
        ownerPhone: data.owner_phone,
        available: data.available,
        createdAt: data.created_at
      };
    }
    return null;
  } catch (error) {
    console.error('Error adding room:', error);
    toast.error('Failed to list room');
    return null;
  }
};

export const updateRoomService = async (id: string, updates: Partial<Room>): Promise<Room | null> => {
  try {
    // Map Room interface updates to database column names
    const dbUpdates: Record<string, any> = {};
    
    if (updates.title) dbUpdates.title = updates.title;
    if (updates.description) dbUpdates.description = updates.description;
    if (updates.images) dbUpdates.images = updates.images;
    if (updates.price !== undefined) dbUpdates.price = updates.price;
    if (updates.location) dbUpdates.location = updates.location;
    if (updates.facilities) dbUpdates.facilities = updates.facilities;
    if (updates.ownerPhone) dbUpdates.owner_phone = updates.ownerPhone;
    if (updates.available !== undefined) dbUpdates.available = updates.available;
    
    const { data, error } = await supabase
      .from('rooms')
      .update(dbUpdates)
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Error updating room:', error);
      toast.error('Failed to update room');
      return null;
    } else if (data && data[0]) {
      // Return updated room
      const roomData = data[0];
      const facilities = roomData.facilities as any;
      
      return {
        id: roomData.id,
        title: roomData.title,
        description: roomData.description,
        images: roomData.images || [],
        price: roomData.price,
        location: roomData.location,
        facilities: facilities ? {
          wifi: Boolean(facilities.wifi),
          bathroom: Boolean(facilities.bathroom),
          gender: facilities.gender as 'male' | 'female' | 'any',
          roomType: facilities.roomType as 'single' | 'sharing'
        } : {},
        ownerId: roomData.owner_id,
        ownerPhone: roomData.owner_phone,
        available: roomData.available,
        createdAt: roomData.created_at
      };
    }
    return null;
  } catch (error) {
    console.error('Error updating room:', error);
    toast.error('Failed to update room');
    return null;
  }
};

export const deleteRoomService = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting room:', error);
      toast.error('Failed to delete room');
      return false;
    }
    
    toast.success('Room deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting room:', error);
    toast.error('Failed to delete room');
    return false;
  }
};

export const updateRoomAvailabilityService = async (id: string, available: boolean): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('rooms')
      .update({ available })
      .eq('id', id);
    
    if (error) {
      console.error('Error updating room availability:', error);
      toast.error('Failed to update room availability');
      return false;
    }
    
    toast.success(`Room ${available ? 'marked as available' : 'marked as unavailable'}`);
    return true;
  } catch (error) {
    console.error('Error updating room availability:', error);
    toast.error('Failed to update room availability');
    return false;
  }
};
