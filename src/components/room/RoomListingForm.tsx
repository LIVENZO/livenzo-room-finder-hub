
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRooms } from '@/context/RoomContext';
import { Room } from '@/types/room';
import { Button } from '@/components/ui/button';
import { CardContent, CardFooter } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import RoomBasicInfo from './RoomFormSections/RoomBasicInfo';
import RoomDescription from './RoomFormSections/RoomDescription';
import RoomPriceLocation from './RoomFormSections/RoomPriceLocation';
import RoomFacilities from './RoomFormSections/RoomFacilities';
import RoomContact from './RoomFormSections/RoomContact';
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
        <RoomBasicInfo title={title} setTitle={setTitle} />
        
        <RoomDescription description={description} setDescription={setDescription} />
        
        <RoomPriceLocation 
          price={price} 
          setPrice={setPrice} 
          location={location} 
          setLocation={setLocation} 
        />
        
        <ImageUploader 
          images={images} 
          setImages={setImages} 
          uploadedFiles={uploadedFiles} 
          setUploadedFiles={setUploadedFiles} 
        />
        
        <RoomFacilities 
          gender={gender} 
          setGender={setGender}
          roomType={roomType} 
          setRoomType={setRoomType} 
          wifi={wifi} 
          setWifi={setWifi}
          bathroom={bathroom} 
          setBathroom={setBathroom} 
        />
        
        <RoomContact phone={phone} setPhone={setPhone} />
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
