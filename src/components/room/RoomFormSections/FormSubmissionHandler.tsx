
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useRooms } from '@/context/RoomContext';
import { Room } from '@/types/room';
import { uploadImagesToStorage, testStorageAccess } from '@/services/imageUploadService';

interface FormSubmissionHandlerProps {
  title: string;
  description: string;
  price: string;
  location: string;
  phone: string;
  wifi: boolean;
  bathroom: boolean;
  gender: 'any' | 'male' | 'female';
  roomType: 'single' | 'sharing';
  images: string[];
  uploadedFiles: File[];
  userId: string;
  session: any;
  storageReady: boolean;
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>;
  setUploadError: React.Dispatch<React.SetStateAction<string | null>>;
  setUploadProgress: React.Dispatch<React.SetStateAction<string | null>>;
  children: React.ReactNode;
}

const FormSubmissionHandler: React.FC<FormSubmissionHandlerProps> = ({
  title,
  description,
  price,
  location,
  phone,
  wifi,
  bathroom,
  gender,
  roomType,
  images,
  uploadedFiles,
  userId,
  session,
  storageReady,
  setIsUploading,
  setUploadError,
  setUploadProgress,
  children
}) => {
  const navigate = useNavigate();
  const { addRoom } = useRooms();

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
    
    // Check storage access again right before upload
    if (!storageReady && session) {
      const hasAccess = await testStorageAccess('rooms');
      if (!hasAccess) {
        toast.error('Storage access is not available. Please log out and log in again.');
        setUploadError('Storage access denied. Please try logging out and back in.');
        return;
      }
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
        
        if (imageUrls.length === 0 && uploadedFiles.length > 0) {
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
        ownerId: session?.user?.id || userId,
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
      {children}
    </form>
  );
};

export default FormSubmissionHandler;
