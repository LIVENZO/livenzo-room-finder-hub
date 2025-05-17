
import React, { useState, useEffect } from 'react';
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
import { useAuth } from '@/context/AuthContext';

interface RoomListingFormProps {
  userId: string;
  userRole: string;
}

const RoomListingForm: React.FC<RoomListingFormProps> = ({ userId, userRole }) => {
  const navigate = useNavigate();
  const { addRoom } = useRooms();
  const { session } = useAuth();
  
  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [wifi, setWifi] = useState(false);
  const [bathroom, setBathroom] = useState(false);
  const [gender, setGender] = useState<'any' | 'male' | 'female'>('any');
  const [roomType, setRoomType] = useState<'single' | 'sharing'>('single');
  
  // Upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  
  // State for uploaded images
  const [images, setImages] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  
  // Verify authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      if (!session && userId !== 'guest') {
        console.warn('No active session detected in RoomListingForm');
      } else {
        console.log('Session detected in RoomListingForm:', session?.user?.id);
      }
      setAuthChecked(true);
    };
    
    checkAuth();
  }, [session, userId]);
  
  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploadError(null);
    setUploadProgress(null);
    
    // Form validation
    if (!title || !description || !price || !location || !phone) {
      toast.error('Please fill in all required fields.');
      return;
    }

    if (images.length === 0) {
      toast.error('Please upload at least one photo of the room.');
      return;
    }
    
    // Check if user is authenticated for uploads
    if (!session && userId !== 'guest') {
      toast.error('You must be logged in to list a room with images.');
      console.error('Authentication required for image upload. No active session.');
      setUploadError('Authentication required. Please log in and try again.');
      return;
    }
    
    setIsUploading(true);
    
    try {
      console.log("Starting room listing submission process");
      console.log("User ID:", userId);
      console.log("Session user ID:", session?.user?.id);
      console.log("Number of images to upload:", uploadedFiles.length);
      
      // Upload images to Supabase Storage
      let imageUrls: string[] = [];
      
      if (uploadedFiles.length > 0) {
        setUploadProgress('Uploading images...');
        
        // Use the authenticated user ID if available, or the provided userId if not
        const effectiveUserId = session?.user?.id || userId;
        console.log("Using effective user ID for upload:", effectiveUserId);
        
        imageUrls = await uploadImagesToStorage(uploadedFiles, effectiveUserId, 'rooms');
        console.log("Image upload results:", imageUrls);
        
        if (imageUrls.length === 0) {
          setUploadError('Failed to upload images. Please check your permissions or try again later.');
          toast.error('Image upload failed. Please ensure you are logged in.');
          setIsUploading(false);
          setUploadProgress(null);
          return;
        }
        
        if (imageUrls.length < uploadedFiles.length) {
          toast.warning(`Only ${imageUrls.length} of ${uploadedFiles.length} images were uploaded successfully. Continuing with available images.`);
        }
      } else {
        // Use local URLs for guests or if no files were uploaded
        imageUrls = images;
      }
      
      setUploadProgress('Creating room listing...');
      
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
        ownerId: userId,
        ownerPhone: phone,
        available: true
      };
      
      console.log("Submitting room data:", newRoom);
      await addRoom(newRoom);
      toast.success('Room listed successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error in handleSubmit:', error);
      setUploadError(`Failed to list room: ${error.message || 'Unknown error'}`);
      toast.error(`Room listing failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
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
        
        {!session && userId !== 'guest' && (
          <div className="text-sm text-amber-500 p-2 bg-amber-50 rounded border border-amber-200">
            Warning: You need to be logged in to upload images. Please log in before proceeding.
          </div>
        )}
        
        {uploadError && (
          <div className="text-sm text-red-500 p-2 bg-red-50 rounded border border-red-200">
            {uploadError}
          </div>
        )}
        
        {uploadProgress && (
          <div className="text-sm text-blue-500 p-2 bg-blue-50 rounded border border-blue-200">
            {uploadProgress}
          </div>
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
              {uploadProgress || 'Uploading...'}
            </>
          ) : "List Room"}
        </Button>
      </CardFooter>
    </form>
  );
};

export default RoomListingForm;
