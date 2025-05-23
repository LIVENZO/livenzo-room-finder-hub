
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Room } from '@/types/room';
import { useAuth } from '@/context/AuthContext';
import { checkIsFavorite, addFavorite, removeFavorite } from '@/services/FavoriteService';
import { fetchUserProfile } from '@/services/UserProfileService';

export const useRoomDetail = (roomId: string | undefined, room: Room | null) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [ownerPhone, setOwnerPhone] = useState<string | null>(null);
  
  useEffect(() => {
    if (!roomId || !room) return;
    
    // Check if room is in user's favorites
    if (user && room) {
      checkIsFavorite(user.id, roomId).then(result => {
        setIsFavorite(result);
      });

      // Use room's owner phone if available, or fetch from user profile
      if (room.ownerPhone) {
        setOwnerPhone(room.ownerPhone);
      } else if (room.ownerId) {
        fetchUserProfile(room.ownerId).then(profile => {
          if (profile && profile.phone) {
            setOwnerPhone(profile.phone);
          } else {
            console.log('Owner phone not found in profile');
          }
        });
      }
    }
  }, [roomId, room, user]);
  
  const handleFavoriteToggle = async () => {
    if (!user || !room) {
      toast.error("Please sign in to save favorites");
      navigate('/');
      return;
    }
    
    setFavoritesLoading(true);
    
    if (isFavorite) {
      const result = await removeFavorite(user.id, room.id);
      if (result) setIsFavorite(false);
    } else {
      const result = await addFavorite(user.id, room.id);
      if (result) setIsFavorite(true);
    }
    
    setFavoritesLoading(false);
  };
  
  const handleCallOwner = () => {
    if (!user) {
      toast.error("Please sign in to contact the owner");
      navigate('/');
      return;
    }
    
    if (!ownerPhone) {
      toast.error("Owner's phone number is not available");
      return;
    }
    
    // Open the phone dialer
    window.location.href = `tel:${ownerPhone}`;
    toast.success("Connecting you to the owner");
  };
  
  // Default values for room details
  const roomRating = 4.5;
  const roomRules = ['No smoking', 'No pets', 'No parties'];
  const roomAmenities = room ? { wifi: room.facilities.wifi, bathroom: room.facilities.bathroom } : {};
  const roomAvailability = 'available';
  
  return {
    isFavorite,
    favoritesLoading,
    selectedImage,
    setSelectedImage,
    ownerPhone,
    handleFavoriteToggle,
    handleCallOwner,
    roomRating,
    roomRules,
    roomAmenities,
    roomAvailability,
  };
};
