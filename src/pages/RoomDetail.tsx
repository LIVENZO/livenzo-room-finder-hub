
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import BookRoom from '@/components/BookRoom';
import RoomReviews from '@/components/RoomReviews';
import { useRooms } from '@/context/RoomContext';
import { Room } from '@/types/room';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Loader2, Heart, MapPin, Wifi, Bath, User, Users, BedSingle, BedDouble, MessageCircle, ChevronLeft, StarIcon } from 'lucide-react';
import { checkIsFavorite, addFavorite, removeFavorite } from '@/services/FavoriteService';
import { format } from 'date-fns';
import { sendMessage } from '@/services/ChatService';
import { toast } from 'sonner';

const RoomDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { rooms } = useRooms();
  const { user } = useAuth();
  
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  
  useEffect(() => {
    if (!id) return;
    
    const roomData = rooms.find(r => r.id === id);
    setRoom(roomData || null);
    setLoading(false);
    
    // Check if room is in user's favorites
    if (user && roomData) {
      checkIsFavorite(user.id, id).then(result => {
        setIsFavorite(result);
      });
    }
  }, [id, rooms, user]);
  
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
  
  const handleContactOwner = async () => {
    if (!user || !room) {
      toast.error("Please sign in to contact the owner");
      navigate('/');
      return;
    }
    
    // Send an initial message to start the conversation
    const initialMessage = {
      sender_id: user.id,
      receiver_id: room.ownerId,
      room_id: room.id,
      message: `Hi, I'm interested in your room "${room.title}". Is it still available?`,
    };
    
    const result = await sendMessage(initialMessage);
    
    if (result) {
      toast.success("Message sent to owner");
      navigate(`/chats/${room.id}`);
    }
  };
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="container max-w-6xl py-10 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }
  
  if (!room) {
    return (
      <Layout>
        <div className="container max-w-6xl py-10">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Room Not Found</h2>
            <p className="mb-6">The room you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate('/find-room')}>Browse Available Rooms</Button>
          </div>
        </div>
      </Layout>
    );
  }
  
  // Adapt to Room interface properties
  const roomRating = 4.5; // Default or placeholder value if room.rating doesn't exist
  const roomRules = ['No smoking', 'No pets', 'No parties']; // Default rules
  const roomAmenities = { wifi: room.facilities.wifi, bathroom: room.facilities.bathroom }; // Adapting to existing structure
  const roomAvailability = 'available'; // Default value
  
  return (
    <Layout>
      <div className="container max-w-6xl py-10">
        <Button
          variant="ghost"
          className="mb-4 pl-0"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Images and details */}
          <div className="lg:col-span-2">
            {/* Image gallery */}
            <div className="space-y-4">
              <AspectRatio ratio={16 / 9} className="bg-muted overflow-hidden rounded-lg">
                <img
                  src={room.images[selectedImage]}
                  alt={`${room.title} - Image ${selectedImage + 1}`}
                  className="object-cover w-full h-full"
                />
              </AspectRatio>
              
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {room.images.map((image, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`cursor-pointer rounded-md overflow-hidden w-20 h-20 flex-shrink-0 border-2 ${
                      selectedImage === index ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <img src={image} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-6">
              <div className="flex items-start justify-between">
                <h1 className="text-3xl font-bold">{room.title}</h1>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={handleFavoriteToggle}
                  disabled={favoritesLoading}
                >
                  {favoritesLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                  )}
                </Button>
              </div>
              
              <div className="flex items-center mt-2">
                <MapPin className="h-4 w-4 text-gray-500 mr-1" />
                <span className="text-gray-500">{room.location}</span>
              </div>
              
              <div className="flex items-center mt-2 space-x-2">
                <div className="flex items-center">
                  <StarIcon className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                  <span>{roomRating || 'New'}</span>
                </div>
                <span className="text-gray-500">•</span>
                <span>Posted on {format(new Date(room.createdAt), 'PP')}</span>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-4">
                <Badge variant="outline" className="flex items-center">
                  {room.facilities.roomType === 'single' ? 
                    <BedSingle className="h-4 w-4 mr-1" /> : 
                    <BedDouble className="h-4 w-4 mr-1" />
                  }
                  {room.facilities.roomType === 'single' ? 'Single' : 'Sharing'} Room
                </Badge>
                
                <Badge variant="outline" className="flex items-center">
                  {room.facilities.gender === 'male' ? (
                    <>
                      <User className="h-4 w-4 mr-1" /> Boys only
                    </>
                  ) : room.facilities.gender === 'female' ? (
                    <>
                      <User className="h-4 w-4 mr-1" /> Girls only
                    </>
                  ) : (
                    <>
                      <Users className="h-4 w-4 mr-1" /> Any gender
                    </>
                  )}
                </Badge>
                
                {room.facilities.wifi && (
                  <Badge variant="outline" className="flex items-center">
                    <Wifi className="h-4 w-4 mr-1" /> WiFi
                  </Badge>
                )}
                
                {room.facilities.bathroom && (
                  <Badge variant="outline" className="flex items-center">
                    <Bath className="h-4 w-4 mr-1" /> Attached Bathroom
                  </Badge>
                )}
              </div>
            </div>
            
            <Tabs defaultValue="description" className="mt-8">
              <TabsList>
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="amenities">Amenities</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>
              <TabsContent value="description" className="py-4">
                <p className="text-gray-700 whitespace-pre-line">{room.description}</p>
                <h3 className="font-semibold mt-6 mb-2">Room Rules</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {roomRules.map((rule, index) => (
                    <li key={index}>{rule}</li>
                  ))}
                </ul>
              </TabsContent>
              <TabsContent value="amenities" className="py-4">
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(roomAmenities).map(([key, value]) => (
                    value && (
                      <div key={key} className="flex items-center">
                        <div className="h-2 w-2 rounded-full bg-primary mr-2" />
                        <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      </div>
                    )
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="reviews" className="py-4">
                <RoomReviews roomId={room.id} />
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Right column - Action card */}
          <div>
            <div className="border rounded-lg shadow-sm p-6 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <div className="text-2xl font-bold">{formatPrice(room.price)}<span className="text-base font-normal">/mo</span></div>
                {roomAvailability === 'available' ? (
                  <Badge className="bg-green-500">Available</Badge>
                ) : (
                  <Badge className="bg-yellow-500">Limited</Badge>
                )}
              </div>
              
              <div className="space-y-4">
                <BookRoom roomId={room.id} ownerId={room.ownerId} />
                
                <Button 
                  variant="outline" 
                  className="w-full flex items-center"
                  onClick={handleContactOwner}
                >
                  <MessageCircle className="h-4 w-4 mr-2" /> Contact Owner
                </Button>
              </div>
              
              <div className="mt-6 text-sm text-gray-500">
                <p>This room is managed by the owner directly.</p>
                <p className="mt-1">Security deposit: {formatPrice(room.price)}</p>
                <p className="mt-4">
                  <strong>Note:</strong> Always verify the property and owner before making any payments.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RoomDetail;
