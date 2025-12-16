import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Layout from '@/components/Layout';
import { uploadImagesToStorage, uploadVideosToStorage } from '@/services/storage';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formSchema, FormValues } from '@/components/room-listing/schemas/roomListingSchema';
import BasicRoomInfoFields from '@/components/room-listing/BasicRoomInfoFields';
import RoomPreferencesFields from '@/components/room-listing/RoomPreferencesFields';
import ImageUploadSection from '@/components/room-listing/ImageUploadSection';
import VideoUploadSection from '@/components/room-listing/VideoUploadSection';
import { fetchUserProfile } from '@/services/UserProfileService';

const ListRoom: React.FC = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);
  const [profileChecked, setProfileChecked] = useState(false);

  // Initialize form with react-hook-form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      house_no: '',
      house_name: '',
      location: '',
      price: 0,
      gender: 'any',
      roomType: 'single',
      coolingType: undefined,
      food: 'not_included',
      wifi: false,
      bathroom: false,
      owner_phone: '',
    },
  });

  // Restore form data if returning from location setup
  useEffect(() => {
    const savedData = localStorage.getItem('list-room-form-data');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        form.reset(parsedData);
        localStorage.removeItem('list-room-form-data'); // Clear after restoring
        toast.success('Your form data has been restored. You can now publish your room.');
      } catch (error) {
        console.error('Error restoring form data:', error);
      }
    }
  }, [form]);
  
  // Redirect if not logged in or not an owner
  useEffect(() => {
    if (!user) {
      toast.error('Please sign in to list a room');
      navigate('/');
      return;
    }
    
    if (userRole !== 'owner') {
      toast.error('Only property owners can list rooms');
      navigate('/dashboard');
      return;
    }
  }, [user, userRole, navigate]);
  
  // Owner location check: Must have location set before listing
  useEffect(() => {
    if (!user) return;
    const checkLocation = async () => {
      const profile = await fetchUserProfile(user.id);
      // Check both latitude and longitude presence and ensure they're not null/0/undefined
      const hasValidLocation =
        !!profile?.location_latitude &&
        !!profile?.location_longitude &&
        typeof profile.location_latitude === "number" &&
        typeof profile.location_longitude === "number";
      if (!hasValidLocation) {
        // Save current form data before redirecting
        const currentValues = form.getValues();
        localStorage.setItem('list-room-form-data', JSON.stringify({
          ...currentValues,
          imageFiles: imageFiles.length, // Store count for reference
        }));
        
        toast.info('Please set your location before publishing your room.');
        navigate('/set-location', { replace: true, state: { backTo: '/list-room' } });
      } else {
        setProfileChecked(true);
      }
    };
    checkLocation();
  }, [user, navigate, form, imageFiles]);
  
  // Only render the page after checking the location
  if (!user || !profileChecked) return null;
  
  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    // Check if adding these files would exceed the 5 image limit
    if (imageFiles.length + files.length > 5) {
      toast.error('You can upload a maximum of 5 images');
      return;
    }
    
    // Convert FileList to array and add to state
    const newFiles = Array.from(files);
    setImageFiles(prev => [...prev, ...newFiles]);
    
    // Create and store image previews
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };
  
  // Remove an image
  const removeImage = (index: number) => {
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(imagePreviews[index]);
    
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Handle video selection
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    // Check if adding these files would exceed the 2 video limit
    if (videoFiles.length + files.length > 2) {
      toast.error('You can upload a maximum of 2 videos');
      return;
    }
    
    // Validate each file
    const newFiles: File[] = [];
    for (const file of Array.from(files)) {
      if (file.type !== 'video/mp4') {
        toast.error(`${file.name}: Only MP4 format is allowed`);
        continue;
      }
      if (file.size > 100 * 1024 * 1024) {
        toast.error(`${file.name}: Maximum size is 100MB`);
        continue;
      }
      newFiles.push(file);
    }
    
    if (newFiles.length === 0) return;
    
    setVideoFiles(prev => [...prev, ...newFiles]);
    
    // Create and store video previews
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    setVideoPreviews(prev => [...prev, ...newPreviews]);
  };

  // Remove a video
  const removeVideo = (index: number) => {
    URL.revokeObjectURL(videoPreviews[index]);
    setVideoFiles(prev => prev.filter((_, i) => i !== index));
    setVideoPreviews(prev => prev.filter((_, i) => i !== index));
  };
  
  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    if (!user) {
      toast.error('You must be logged in to list a room');
      return;
    }
    
    if (imageFiles.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log('Starting room listing process...');
      console.log('User ID:', user.id);
      console.log('Images to upload:', imageFiles.length);
      console.log('Videos to upload:', videoFiles.length);
      
      // Step 1: Upload images to Supabase Storage
      const toastId = toast.loading('Uploading images...');
      
      const imageUrls = await uploadImagesToStorage(imageFiles, user.id, 'rooms');
      
      if (imageUrls.length === 0) {
        console.error('Image upload failed - no URLs returned');
        toast.error('Failed to upload images. Please try again or contact support.', { id: toastId });
        setIsSubmitting(false);
        return;
      }
      
      console.log('Images uploaded successfully:', imageUrls);

      // Step 2: Upload videos if any
      let videoUrls: string[] = [];
      if (videoFiles.length > 0) {
        toast.loading('Uploading videos...', { id: toastId });
        videoUrls = await uploadVideosToStorage(videoFiles, user.id, 'rooms');
        console.log('Videos uploaded:', videoUrls);
      }
      
      toast.loading('Creating room listing...', { id: toastId });
      
      // Step 3: Save room data to Supabase
      const roomData = {
        title: values.title,
        description: values.description,
        house_no: values.house_no || null,
        house_name: values.house_name || null,
        location: values.location,
        price: values.price,
        facilities: {
          wifi: values.wifi,
          bathroom: values.bathroom,
          gender: values.gender,
          roomType: values.roomType,
          coolingType: values.coolingType,
          food: values.food,
        },
        owner_id: user.id,
        owner_phone: values.owner_phone,
        images: imageUrls,
        videos: videoUrls,
      };
      
      console.log('Inserting room data:', roomData);
      
      const { data: room, error } = await supabase
        .from('rooms')
        .insert(roomData)
        .select()
        .single();
      
      if (error) {
        console.error('Error inserting room:', error);
        toast.error(`Failed to create listing: ${error.message}`, { id: toastId });
        setIsSubmitting(false);
        return;
      }
      
      console.log('Room created successfully:', room);
      toast.success('Room listed successfully!', { id: toastId });
      
      // Step 4: Redirect to my listings
      navigate('/my-listings');
      
    } catch (error: any) {
      console.error('Error in room submission:', error);
      toast.error(`An unexpected error occurred: ${error.message || 'Unknown error'}. Please contact support if this persists.`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!user) return null;
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">List Your Room</h1>
        
        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <BasicRoomInfoFields control={form.control} />
                
                <ImageUploadSection
                  imageFiles={imageFiles}
                  imagePreviews={imagePreviews}
                  isSubmitting={isSubmitting}
                  onImageChange={handleImageChange}
                  onRemoveImage={removeImage}
                />

                <VideoUploadSection
                  videoFiles={videoFiles}
                  videoPreviews={videoPreviews}
                  isSubmitting={isSubmitting}
                  onVideoChange={handleVideoChange}
                  onRemoveVideo={removeVideo}
                />
                
                <RoomPreferencesFields control={form.control} />
                
                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    'Publish Room Listing'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ListRoom;
