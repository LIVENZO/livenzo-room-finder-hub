import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useRooms } from '@/context/RoomContext';
import Layout from '@/components/Layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Wifi, DollarSign, Bath, User, Users, Calendar, Phone } from 'lucide-react';
import { toast } from 'sonner';

const RoomDetail: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { rooms } = useRooms();
  const { id } = useParams<{ id: string }>();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);
  
  const room = rooms.find(r => r.id === id);
  
  if (!user) return null;
  
  if (!room) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Room not found</h1>
          <p className="mb-6">The room you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/find-room')}>
            Browse Available Rooms
          </Button>
        </div>
      </Layout>
    );
  }
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };
  
  const getGenderText = () => {
    switch (room.facilities.gender) {
      case 'male':
        return 'Boys only';
      case 'female':
        return 'Girls only';
      default:
        return 'Any gender';
    }
  };
  
  const getGenderIcon = () => {
    switch (room.facilities.gender) {
      case 'male':
        return <User className="h-5 w-5 mr-2" />;
      case 'female':
        return <User className="h-5 w-5 mr-2" />;
      default:
        return <Users className="h-5 w-5 mr-2" />;
    }
  };
  
  const handleContactOwner = () => {
    toast.success(`Contact info: ${room.ownerPhone}`);
  };
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/find-room')}
          className="mb-4"
        >
          ← Back to search results
        </Button>
        
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-2/3">
            <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-video mb-4">
              <img 
                src={room.images[selectedImageIndex]} 
                alt={room.title} 
                className="w-full h-full object-cover" 
              />
            </div>
            
            {room.images.length > 1 && (
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {room.images.map((image, index) => (
                  <div 
                    key={index}
                    className={`cursor-pointer rounded-md overflow-hidden border-2 ${
                      selectedImageIndex === index ? 'border-primary' : 'border-transparent'
                    }`}
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    <img 
                      src={image} 
                      alt={`Room ${index + 1}`} 
                      className="w-20 h-20 object-cover" 
                    />
                  </div>
                ))}
              </div>
            )}
            
            <h1 className="text-3xl font-bold mb-2">{room.title}</h1>
            <div className="flex items-center mb-4 text-gray-600">
              <MapPin className="h-5 w-5 mr-2" />
              <span>{room.location}</span>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-6">
              <Badge className="px-3 py-1 flex items-center">
                <DollarSign className="h-4 w-4 mr-1" />
                {formatPrice(room.price)}/month
              </Badge>
              {room.facilities.wifi && (
                <Badge variant="outline" className="px-3 py-1 flex items-center">
                  <Wifi className="h-4 w-4 mr-1" />
                  WiFi Included
                </Badge>
              )}
              <Badge variant="outline" className="px-3 py-1 flex items-center">
                {getGenderIcon()}
                {getGenderText()}
              </Badge>
              {room.facilities.bathroom && (
                <Badge variant="outline" className="px-3 py-1 flex items-center">
                  <Bath className="h-4 w-4 mr-1" />
                  Private Bathroom
                </Badge>
              )}
            </div>
            
            <div className="bg-white rounded-lg border p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Description</h2>
              <p className="text-gray-600 whitespace-pre-line">{room.description}</p>
            </div>
            
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Additional Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Listed on</p>
                    <p className="font-medium">{room.createdAt}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Phone className="h-5 w-5 text-gray-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Contact</p>
                    <p className="font-medium">Available by request</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="lg:w-1/3">
            <div className="bg-white rounded-lg border p-6 sticky top-4">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-1">{formatPrice(room.price)}/month</h2>
                <p className="text-gray-600">Utilities {room.facilities.wifi ? 'included' : 'not included'}</p>
              </div>
              
              <div className="space-y-4">
                <Button className="w-full" size="lg" onClick={handleContactOwner}>
                  Contact Owner
                </Button>
                <Button variant="outline" className="w-full" size="lg">
                  Save to Favorites
                </Button>
              </div>
              
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-medium mb-2">Safety tips</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Always visit the property before making any payment</li>
                  <li>• Verify the identity of the owner</li>
                  <li>• Do not make payments via wire transfer to unknown individuals</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RoomDetail;
