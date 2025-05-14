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
import { Upload, ImagePlus, X, Loader2 } from 'lucide-react';
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
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
  const [isUploading, setIsUploading] = useState(false);
  
  // State for uploaded images
  const [images, setImages] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  
  useEffect(() => {
    if (!user && !localStorage.getItem('guest_mode')) {
      navigate('/');
    }
  }, [user, navigate]);

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Check if we're not exceeding the max number of images
    if (uploadedFiles.length + files.length > 5) {
      toast.error("You can upload maximum 5 images");
      return;
    }

    // Create new arrays to store the updated files and preview URLs
    const newUploadedFiles: File[] = [...uploadedFiles];
    const newImages: string[] = [...images];

    // Process each file
    Array.from(files).forEach(file => {
      // Only process image files
      if (!file.type.match('image.*')) {
        toast.error(`${file.name} is not an image file`);
        return;
      }

      // Create a URL for the image preview
      const imageUrl = URL.createObjectURL(file);
      newImages.push(imageUrl);
      newUploadedFiles.push(file);
    });

    // Update state with new files and previews
    setImages(newImages);
    setUploadedFiles(newUploadedFiles);
    
    // Reset the file input
    e.target.value = '';
  };

  // Remove an image from the upload list
  const removeImage = (index: number) => {
    const newImages = [...images];
    const newUploadedFiles = [...uploadedFiles];
    
    // Release the object URL to avoid memory leaks
    URL.revokeObjectURL(newImages[index]);
    
    newImages.splice(index, 1);
    newUploadedFiles.splice(index, 1);
    
    setImages(newImages);
    setUploadedFiles(newUploadedFiles);
  };
  
  // Upload images to Supabase Storage
  const uploadImagesToSupabase = async (): Promise<string[]> => {
    if (!uploadedFiles.length) return [];
    
    const uploadedUrls: string[] = [];
    
    try {
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${user ? user.id : 'guest'}/${fileName}`;
        
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
      const imageUrls = user 
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
        ownerId: user ? user.id : 'guest',
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
                <Label className="text-base">Room Photos *</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {images.map((image, idx) => (
                    <div key={idx} className="relative aspect-square rounded-md overflow-hidden bg-gray-100 border">
                      <img 
                        src={image} 
                        alt={`Room ${idx + 1}`} 
                        className="w-full h-full object-cover"
                      />
                      <button 
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-black bg-opacity-50 rounded-full p-1"
                        aria-label="Remove image"
                      >
                        <X className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  ))}
                  
                  {images.length < 5 && (
                    <label className="border-2 border-dashed rounded-md flex flex-col items-center justify-center aspect-square bg-gray-50 text-gray-500 cursor-pointer hover:bg-gray-100 transition-colors">
                      <Input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        multiple={true}
                      />
                      <ImagePlus className="h-8 w-8 mb-2 text-gray-400" />
                      <span className="text-sm font-medium">Upload Photo</span>
                      <span className="text-xs text-gray-400">{images.length}/5</span>
                    </label>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Upload up to 5 photos of your room. First photo will be used as the main image.
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
                disabled={isUploading}
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
        </Card>
      </div>
    </Layout>
  );
};

export default ListRoom;
