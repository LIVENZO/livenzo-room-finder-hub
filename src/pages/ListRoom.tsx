import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Layout from '@/components/Layout';
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
import { mediaProcessingQueue } from '@/services/MediaProcessingQueue';

const ListRoom: React.FC = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);
  const [profileChecked, setProfileChecked] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      house_no: '',
      house_name: '',
      room_number: '',
      location: '',
      price: 0,
      gender: undefined,
      roomType: undefined,
      coolingType: undefined,
      food: undefined,
      wifi: undefined,
      bathroom: undefined,
      laundry: undefined,
      electricBill: undefined,
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
        localStorage.removeItem('list-room-form-data');
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
  
  // Owner location check
  useEffect(() => {
    if (!user) return;
    const checkLocation = async () => {
      const profile = await fetchUserProfile(user.id);
      const hasValidLocation =
        !!profile?.location_latitude &&
        !!profile?.location_longitude &&
        typeof profile.location_latitude === "number" &&
        typeof profile.location_longitude === "number";
      if (!hasValidLocation) {
        const currentValues = form.getValues();
        localStorage.setItem('list-room-form-data', JSON.stringify({
          ...currentValues,
          imageFiles: imageFiles.length,
        }));
        toast.info('Please set your location before publishing your room.');
        navigate('/set-location', { replace: true, state: { backTo: '/list-room' } });
      } else {
        setProfileChecked(true);
      }
    };
    checkLocation();
  }, [user, navigate, form, imageFiles]);
  
  if (!user || !profileChecked) return null;
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    if (imageFiles.length + files.length > 5) {
      toast.error('You can upload a maximum of 5 images');
      return;
    }
    const newFiles = Array.from(files);
    setImageFiles(prev => [...prev, ...newFiles]);
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };
  
  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    if (videoFiles.length + files.length > 2) {
      toast.error('You can upload a maximum of 2 videos');
      return;
    }
    const newFiles = Array.from(files);
    setVideoFiles(prev => [...prev, ...newFiles]);
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    setVideoPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeVideo = (index: number) => {
    URL.revokeObjectURL(videoPreviews[index]);
    setVideoFiles(prev => prev.filter((_, i) => i !== index));
    setVideoPreviews(prev => prev.filter((_, i) => i !== index));
  };
  
  /**
   * Upload original (uncompressed) files directly for instant save.
   * Background queue will compress and replace them later.
   */
  const uploadOriginalFiles = async (
    files: File[],
    userId: string,
    bucket: string,
    subfolder: string
  ): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of files) {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      const ext = file.name.split('.').pop() || 'jpg';
      const filePath = `${userId}/${subfolder}/${timestamp}_${random}.${ext}`;

      const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
        cacheControl: '31536000',
        upsert: false,
      });

      if (error) {
        console.error('Upload error:', error);
        continue;
      }

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
      if (urlData?.publicUrl) urls.push(urlData.publicUrl);
    }
    return urls;
  };

  // Handle form submission - instant save with background processing
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
      const toastId = toast.loading('Uploading media…');
      
      // Upload originals (no compression - fast!)
      const imageUrls = await uploadOriginalFiles(imageFiles, user.id, 'rooms', 'originals');
      
      if (imageUrls.length === 0) {
        toast.error('Failed to upload images. Please try again.', { id: toastId });
        setIsSubmitting(false);
        return;
      }

      let videoUrls: string[] = [];
      if (videoFiles.length > 0) {
        toast.loading('Uploading videos…', { id: toastId });
        videoUrls = await uploadOriginalFiles(videoFiles, user.id, 'rooms', 'originals');
      }
      
      toast.loading('Creating listing…', { id: toastId });
      
      // Save room with original media + media_processing flag
      const roomData = {
        title: values.title,
        description: values.description,
        house_no: values.house_no || null,
        house_name: values.house_name || null,
        room_number: values.room_number || null,
        location: values.location,
        price: values.price,
        facilities: {
          wifi: values.wifi === 'yes',
          bathroom: values.bathroom === 'yes',
          laundry: values.laundry === 'yes',
          electricBill: values.electricBill === 'yes',
          gender: values.gender,
          roomType: values.roomType,
          coolingType: values.coolingType === 'none' ? undefined : values.coolingType,
          food: values.food,
        },
        owner_id: user.id,
        owner_phone: values.owner_phone,
        images: imageUrls,
        videos: videoUrls,
        media_processing: true, // Flag: background compression pending
      };
      
      const { data: room, error } = await supabase
        .from('rooms')
        .insert(roomData)
        .select()
        .single();
      
      if (error) {
        toast.error(`Failed to create listing: ${error.message}`, { id: toastId });
        setIsSubmitting(false);
        return;
      }
      
      toast.success('Listing saved! Media is being optimized in the background.', { id: toastId });

      // Navigate immediately so submit flow feels instant
      navigate('/my-listings', { replace: true });

      // Start compression asynchronously (decoupled from ListRoom UI lifecycle)
      setTimeout(() => {
        mediaProcessingQueue.enqueue(room.id, user.id, imageUrls, videoUrls);
      }, 0);
      
    } catch (error: any) {
      console.error('Error in room submission:', error);
      toast.error(`An unexpected error occurred: ${error.message || 'Unknown error'}`);
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
