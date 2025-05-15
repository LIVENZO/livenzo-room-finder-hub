import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRooms } from '@/context/RoomContext';
import { Room } from '@/types/room';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import {
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import ImageUploader from './ImageUploader';

interface RoomListingFormProps {
  userId: string;
  userRole: string;
}

const RoomListingForm: React.FC<RoomListingFormProps> = ({ userId, userRole }) => {
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
  const [isUploading, setIsUploading] = useState(false);
  
  // State for uploaded images
  const [images, setImages] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  
  // Upload images to Supabase Storage
  const uploadImagesToSupabase = async (): Promise<string[]> => {
    if (!uploadedFiles.length) return [];
    
    const uploadedUrls: string[] = [];
    
    try {
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${userId ? userId : 'guest'}/${fileName}`;
        
        // Upload the file to Supabase Storage
        const { data, error } = await supabase.storage
          .from('avatars') // Using avatars bucket until rooms bucket is set up
          .upload(filePath, file);
        
        if (error) {
          console.error('Error uploading image to Supabase:', error);
          // Fall back to the object URL for now
          uploadedUrls.push(images[i]);
        } else {
          // Get the public URL
          const { data: publicUrlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);
          
          uploadedUrls.push(publicUrlData.publicUrl);
        }
      }
    } catch (error) {
      console.error('Error in uploadImagesToSupabase:', error);
      // If there's an error, fall back to the object URLs
      return images;
    }
    
    return uploadedUrls.length ? uploadedUrls : images;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !description || !price || !location || !phone) {
      toast.error('Please fill in all required fields.');
      return;
    }

    if (images.length === 0) {
      toast.error('Please upload at least one photo of the room.');
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Upload images to Supabase Storage if the user is authenticated
      const imageUrls = userId 
        ? await uploadImagesToSupabase() 
        : images; // Use local URLs for guests
      
      const newRoom: Omit<Room, 'id' | 'createdAt'> = {
        title,
        description,
        images: imageUrls,
        price: parseInt(price),
        location,
        facilities: {
          wifi,
          gender,
          bathroom,
          roomType,
        },
        ownerId: userId ? userId : 'guest',
        ownerPhone: phone,
      };
      
      await addRoom(newRoom);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error in handleSubmit:', error);
      toast.error(`Failed to list room: ${error.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
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
        
        <ImageUploader 
          images={images} 
          setImages={setImages} 
          uploadedFiles={uploadedFiles} 
          setUploadedFiles={setUploadedFiles} 
        />
        
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
          disabled={isUploading || userRole !== 'owner'}
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : "List Room"}
        </Button>
      </CardFooter>
    </form>
  );
};

export default RoomListingForm;
