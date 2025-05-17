
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth'; // Updated import
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Plus } from 'lucide-react';
import { Room } from '@/types/room';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import RoomList from '@/components/dashboard/RoomList';
import { parseFacilities } from '@/utils/roomUtils';

const MyListings: React.FC = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingRoom, setUpdatingRoom] = useState<string | null>(null);
  
  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      navigate('/');
      return;
    }
    
    // Redirect if not an owner
    if (userRole !== 'owner') {
      navigate('/dashboard');
      return;
    }
    
    // Load owner's listings
    loadMyRooms();
  }, [user, userRole, navigate]);
  
  const loadMyRooms = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading rooms:', error);
        return;
      }
      
      // Map database response to Room type
      const mappedRooms: Room[] = data.map(room => {
        // Create the base room object with required properties
        const roomObj: Room = {
          id: room.id,
          title: room.title,
          description: room.description,
          images: Array.isArray(room.images) ? room.images : [],
          price: Number(room.price),
          location: room.location,
          facilities: parseFacilities(room.facilities),
          ownerId: room.owner_id,
          ownerPhone: room.owner_phone,
          available: room.available,
          createdAt: room.created_at
        };
        
        // Add optional properties only if they exist in the database record
        // TypeScript safe way to handle potentially missing properties
        if ('house_no' in room && room.house_no) {
          roomObj.house_no = room.house_no;
        }
        
        if ('house_name' in room && room.house_name) {
          roomObj.house_name = room.house_name;
        }
        
        return roomObj;
      });
      
      setRooms(mappedRooms);
    } catch (error) {
      console.error('Error in loadMyRooms:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!user) return null;
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Room Listings</h1>
          <Button onClick={() => navigate('/list-room')} className="flex items-center">
            <Plus className="h-4 w-4 mr-1" /> 
            List a Room
          </Button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-medium mb-2">No Room Listings Yet</h3>
            <p className="text-gray-500 mb-6">
              Start by creating your first room listing.
            </p>
            <Button onClick={() => navigate('/list-room')}>
              List Your First Room
            </Button>
          </div>
        ) : (
          <RoomList 
            rooms={rooms} 
            updatingRoom={updatingRoom}
            setUpdatingRoom={setUpdatingRoom}
          />
        )}
      </div>
    </Layout>
  );
};

export default MyListings;
