
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import { useNavigate } from 'react-router-dom';
import { useRoom } from '@/context/RoomContext';
import { fetchUserFavorites } from '@/services/FavoriteService';
import RoomCard from '@/components/RoomCard';
import { Loader2 } from 'lucide-react';

const Favorites = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { rooms } = useRoom();
  
  const [loading, setLoading] = useState(true);
  const [favoriteRoomIds, setFavoriteRoomIds] = useState<string[]>([]);
  
  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    
    const loadFavorites = async () => {
      setLoading(true);
      const favorites = await fetchUserFavorites(user.id);
      setFavoriteRoomIds(favorites);
      setLoading(false);
    };
    
    loadFavorites();
  }, [user, navigate]);
  
  // Filter rooms by favorites
  const favoriteRooms = rooms.filter(room => favoriteRoomIds.includes(room.id));
  
  return (
    <Layout>
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-6">Your Favorite Rooms</h1>
        
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : favoriteRooms.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-gray-500 mb-4">You haven't added any rooms to your favorites yet</p>
            <button
              onClick={() => navigate('/find-room')}
              className="text-primary hover:underline"
            >
              Browse available rooms
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoriteRooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Favorites;
