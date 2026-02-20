
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Room } from '@/types/room';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import RoomFacilityBadges from './room/RoomFacilityBadges';
import RoomLocation from './room/RoomLocation';
import { formatDistance } from '@/utils/roomUtils';
import { formatPrice } from '@/lib/utils';
import { Heart, Share2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { addFavorite, removeFavorite, checkIsFavorite } from '@/services/FavoriteService';
import { toast } from 'sonner';

interface RoomCardProps {
  room: Room;
}

const RoomCard: React.FC<RoomCardProps> = ({ room }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && room.id) {
      checkIsFavorite(user.id, room.id).then(setIsFavorite);
    }
  }, [user, room.id]);

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast.error("Please sign in to save favorites");
      navigate('/');
      return;
    }

    setIsLoading(true);
    
    if (isFavorite) {
      const result = await removeFavorite(user.id, room.id);
      if (result) setIsFavorite(false);
    } else {
      const result = await addFavorite(user.id, room.id);
      if (result) setIsFavorite(true);
    }
    
    setIsLoading(false);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const shareUrl = `https://livenzo-room-finder-hub.lovable.app/room/${room.id}`;
    const shareText = `Check out this room on Livenzo 👇\n₹${room.price.toLocaleString()}/month – ${room.title}, ${room.location}\n${shareUrl}`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank');
  };

  const discountedPrice = Math.round(room.price * 0.75);

  return (
    <Card 
      className="overflow-hidden cursor-pointer transition-all hover:shadow-lg"
      onClick={() => navigate(`/room/${room.id}`)}
    >
      <AspectRatio ratio={16/9} className="relative">
        <img 
          src={room.images[0]} 
          alt={room.title} 
          className="w-full h-full object-cover"
        />
        {/* Action buttons - top left */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          <button
            onClick={handleFavoriteToggle}
            disabled={isLoading}
            className="p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/95 transition-colors shadow-sm"
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart 
              className={`h-4 w-4 transition-colors ${
                isFavorite ? 'fill-red-500 text-red-500' : 'text-foreground/70'
              }`} 
            />
          </button>
          <button
            onClick={handleShare}
            className="p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/95 transition-colors shadow-sm"
            aria-label="Share room"
          >
            <Share2 className="h-4 w-4 text-foreground/70" />
          </button>
        </div>
        {/* Price and distance badges - top right */}
        <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
          {room.distance !== undefined && (
            <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm text-foreground font-medium">
              📍 {formatDistance(room.distance)}
            </Badge>
          )}
          <div className="flex items-center gap-1.5">
            <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-muted-foreground text-[10px] line-through px-1.5 py-0.5">
              {formatPrice(room.price)}
            </Badge>
            <Badge className="bg-primary text-primary-foreground font-semibold">
              {formatPrice(discountedPrice)}/mo
            </Badge>
          </div>
          <Badge variant="secondary" className="bg-green-500/90 text-white text-[10px] px-1.5 py-0.5 backdrop-blur-sm">
            Save 25%
          </Badge>
        </div>
      </AspectRatio>
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold line-clamp-1">{room.title}</h3>
        <RoomLocation location={room.location} />
      </CardContent>
      <CardFooter className="p-4 pt-0 flex flex-wrap gap-2">
        <RoomFacilityBadges room={room} />
      </CardFooter>
    </Card>
  );
};

export default RoomCard;
