
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useRooms, Room } from '@/context/RoomContext';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";

const ListRoom: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addRoom } = useRooms();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [wifi, setWifi] = useState(false);
  const [bathroom, setBathroom] = useState(false);
  const [gender, setGender] = useState<'any' | 'male' | 'female'>('any');
  const [roomType, setRoomType] = useState<'single' | 'sharing'>('single');
  
  // This would be replaced with actual image uploads in a real app
  const [images] = useState([
    'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=500&auto=format',
    'https://images.unsplash.com/photo-1721322800607-8c38375eef04?w=500&auto=format'
  ]);
  
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !description || !price || !location || !phone) {
      alert('Please fill in all required fields.');
      return;
    }
    
    const newRoom: Omit<Room, 'id' | 'createdAt'> = {
      title,
      description,
      images,
      price: parseInt(price),
      location,
      facilities: {
        wifi,
        gender,
        bathroom,
        roomType,
      },
      ownerId: user!.id,
      ownerPhone: phone,
    };
    
    addRoom(newRoom);
    navigate('/dashboard');
  };
  
  if (!user) return null;
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">List Your Room</h1>
        
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Room Details</CardTitle>
              <CardDescription>
                Provide detailed information about the room you want to list.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-base">Room Title *</Label>
                <Input
                  id="title"
                  placeholder="E.g., Cozy Single Room in Downtown"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-base">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your room in detail (amenities, surroundings, rules, etc.)"
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-base">Monthly Rent (₹) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    placeholder="Enter monthly rent"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-base">Location *</Label>
                  <Input
                    id="location"
                    placeholder="City, State"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <Label className="text-base">Room Photos</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {images.map((image, idx) => (
                    <div key={idx} className="relative aspect-square rounded-md overflow-hidden">
                      <img 
                        src={image} 
                        alt={`Room ${idx + 1}`} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  <div className="border-2 border-dashed rounded-md flex items-center justify-center aspect-square bg-gray-50 text-gray-500">
                    <div className="text-center p-2">
                      <p className="text-xs">Upload Photo</p>
                      <p className="text-xs">(Coming Soon)</p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Note: In this demo, sample photos are used. In a real app, you would be able to upload your own photos.
                </p>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-medium">Facilities</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-sm">Gender Preference</Label>
                  <Select 
                    value={gender}
                    onValueChange={(value: 'any' | 'male' | 'female') => setGender(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Gender</SelectItem>
                      <SelectItem value="male">Boys Only</SelectItem>
                      <SelectItem value="female">Girls Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm">Room Type</Label>
                  <RadioGroup
                    value={roomType}
                    onValueChange={(value: 'single' | 'sharing') => setRoomType(value)}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="single" id="list-single" />
                      <Label htmlFor="list-single">Single Room</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sharing" id="list-sharing" />
                      <Label htmlFor="list-sharing">Sharing Room</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="wifi-switch" className="cursor-pointer">WiFi Included</Label>
                  <Switch
                    id="wifi-switch"
                    checked={wifi}
                    onCheckedChange={setWifi}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="bathroom-switch" className="cursor-pointer">Connected Bathroom</Label>
                  <Switch
                    id="bathroom-switch"
                    checked={bathroom}
                    onCheckedChange={setBathroom}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-base">Contact Phone Number *</Label>
                <Input
                  id="phone"
                  placeholder="Your phone number for inquiries"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col sm:flex-row gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/dashboard')}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="w-full sm:w-auto"
              >
                List Room
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </Layout>
  );
};

export default ListRoom;
