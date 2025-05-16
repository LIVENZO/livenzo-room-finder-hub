
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRooms } from '@/context/RoomContext';
import { Room } from '@/types/room';
import { Button } from '@/components/ui/button';
import { CardContent, CardFooter } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { uploadImagesToStorage } from '@/services/imageUploadService';
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
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // State for uploaded images
  const [images, setImages] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);
    
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
      console.log("Starting room listing submission process");
      console.log("User ID:", userId);
      console.log("Number of images to upload:", uploadedFiles.length);
      
      // Upload images to Supabase Storage if the user is authenticated
      const imageUrls = userId 
        ? await uploadImagesToStorage(uploadedFiles, userId, 'rooms') 
        : images; // Use local URLs for guests
      
      console.log("Image upload results:", imageUrls);
      
      if (userId && imageUrls.length === 0 && uploadedFiles.length > 0) {
        setUploadError('Failed to upload images. Please try again.');
        toast.error('Failed to upload images. Please try again.');
        setIsUploading(false);
        return;
      }
      
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
      
      console.log("Submitting room data:", newRoom);
      await addRoom(newRoom);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error in handleSubmit:', error);
      setUploadError('Failed to list room. Please try again.');
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
        
        {uploadError && (
          <div className="text-sm text-red-500">{uploadError}</div>
        )}
        
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
