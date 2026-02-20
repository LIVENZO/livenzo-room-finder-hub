
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
import { Button } from '@/components/ui/button';
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
          <Badge className="bg-primary text-primary-foreground font-semibold">
            {formatPrice(room.price)}/mo
          </Badge>
        </div>
        {/* Green discount sticker - bottom right of image */}
        <div className="absolute bottom-2 right-2 overflow-hidden rounded-xl shadow-lg"
          style={{ 
            background: 'linear-gradient(135deg, hsl(145 65% 48%), hsl(160 60% 42%), hsl(150 55% 38%))',
            minWidth: '140px',
          }}>
          {/* Sparkle decorations */}
          <div className="absolute top-1 right-3 w-1 h-1 rounded-full bg-white/60" />
          <div className="absolute top-3 right-6 w-0.5 h-0.5 rounded-full bg-white/40" />
          <div className="absolute bottom-4 left-3 w-0.5 h-0.5 rounded-full bg-white/30" />
          <div className="absolute top-2 left-1/2 w-[3px] h-[3px] rounded-full bg-white/20" />
          
          <div className="relative px-3.5 pt-2 pb-2.5">
            {/* Top row: discount + icon */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white font-extrabold text-base leading-none tracking-tight">
                  25<span className="text-xs align-top">%</span> OFF
                </p>
                <p className="text-white/85 text-[10px] font-medium mt-0.5 leading-tight">
                  for First Month
                </p>
              </div>
              <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center mt-0.5">
                <svg className="w-3 h-3 text-white/90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 17l9.2-9.2M17 17V7H7" />
                </svg>
              </div>
            </div>
            {/* Price row */}
            <div className="flex items-baseline gap-1.5 mt-1.5 border-t border-white/15 pt-1.5">
              <span className="text-white/50 text-[10px] line-through">{formatPrice(room.price)}</span>
              <span className="text-white font-bold text-sm tracking-tight">{formatPrice(discountedPrice)}/mo</span>
            </div>
          </div>
        </div>
      </AspectRatio>
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold line-clamp-1">{room.title}</h3>
        <RoomLocation location={room.location} />
      </CardContent>
      <CardFooter className="p-4 pt-0 flex flex-col gap-3">
        <div className="flex flex-wrap gap-2 w-full">
          <RoomFacilityBadges room={room} />
        </div>
        <div className="flex gap-2 w-full">
          <Button
            size="sm"
            className="flex-1 h-9 rounded-lg text-xs font-semibold"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/room/${room.id}`);
            }}
          >
            Book
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-9 rounded-lg text-xs font-semibold border-primary/30 text-primary hover:bg-primary/5"
            onClick={(e) => {
              e.stopPropagation();
              toast.success(`You save ${formatPrice(Math.round(room.price * 0.25))} on first month!`);
            }}
          >
            Save {formatPrice(Math.round(room.price * 0.25))}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default RoomCard;
