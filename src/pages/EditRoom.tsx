import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/auth';
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
import { parseFacilities } from '@/utils/roomUtils';

const EditRoom: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);
  const [existingVideos, setExistingVideos] = useState<string[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      house_no: '',
      house_name: '',
      location: '',
      propertyType: undefined,
      price: undefined,
      pgRent: undefined,
      hostelRent: undefined,
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

  // Load existing room data - runs only once on mount
  const hasLoaded = React.useRef(false);
  useEffect(() => {
    if (!user || !id || hasLoaded.current) return;
    hasLoaded.current = true;
    
    const loadRoomData = async () => {
      try {
        const { data, error } = await supabase
          .from('rooms')
          .select('*')
          .eq('id', id)
          .eq('owner_id', user.id)
          .single();

        if (error) {
          console.error('Error loading room:', error);
          toast.error('Failed to load room data');
          navigate('/my-listings');
          return;
        }

        if (!data) {
          toast.error('Room not found');
          navigate('/my-listings');
          return;
        }

        const facilitiesRaw = typeof data.facilities === 'object' ? data.facilities as any : {};
        const facilities = parseFacilities(data.facilities);

        const propertyType = (data as any).property_type as string | null;
        const isPgHostel = propertyType === 'PG_HOSTEL';

        form.reset({
          title: data.title,
          description: data.description,
          house_no: data.house_no || '',
          house_name: data.house_name || '',
          location: data.location,
          propertyType: (propertyType as any) || undefined,
          price: isPgHostel ? undefined : Number(data.price),
          pgRent: isPgHostel ? Number((data as any).pg_rent) : undefined,
          hostelRent: isPgHostel ? Number((data as any).hostel_rent) : undefined,
          gender: facilities.gender || undefined,
          roomType: facilities.roomType || undefined,
          coolingType: facilities.coolingType || (facilitiesRaw?.coolingType === undefined ? undefined : 'none'),
          food: facilities.food || undefined,
          wifi: facilities.wifi ? 'yes' : (facilitiesRaw?.wifi !== undefined ? 'no' : undefined),
          bathroom: facilities.bathroom ? 'yes' : (facilitiesRaw?.bathroom !== undefined ? 'no' : undefined),
          laundry: facilitiesRaw?.laundry === true ? 'yes' : (facilitiesRaw?.laundry === false ? 'no' : undefined),
          electricBill: facilitiesRaw?.electricBill === true ? 'yes' : (facilitiesRaw?.electricBill === false ? 'no' : undefined),
          owner_phone: data.owner_phone,
        });

        if (data.images && Array.isArray(data.images)) {
          setExistingImages(data.images);
          setImagePreviews(data.images);
        }

        if (data.videos && Array.isArray(data.videos)) {
          setExistingVideos(data.videos);
          setVideoPreviews(data.videos);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error in loadRoomData:', error);
        toast.error('Failed to load room');
        navigate('/my-listings');
      }
    };

    loadRoomData();
  }, [user, id, navigate]);

  // Redirect if not logged in or not an owner
  useEffect(() => {
    if (!user) {
      toast.error('Please sign in to edit a room');
      navigate('/');
      return;
    }
    
    if (userRole !== 'owner') {
      toast.error('Only property owners can edit rooms');
      navigate('/dashboard');
      return;
    }
  }, [user, userRole, navigate]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = existingImages.length + imageFiles.length + files.length;
    
    if (totalImages > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    setImageFiles(prev => [...prev, ...files]);
    
    // Create previews for new files and append to existing previews
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...existingImages, ...prev.slice(existingImages.length), ...newPreviews]);
  };

  const removeImage = (index: number) => {
    // Check if it's an existing image or new file
    if (index < existingImages.length) {
      // Remove from existing images
      setExistingImages(prev => prev.filter((_, i) => i !== index));
    } else {
      // Remove from new files
      const fileIndex = index - existingImages.length;
      setImageFiles(prev => prev.filter((_, i) => i !== fileIndex));
    }
    
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalVideos = existingVideos.length + videoFiles.length + files.length;
    
    if (totalVideos > 2) {
      toast.error('Maximum 2 videos allowed');
      return;
    }

    // Validate files
    const validFiles: File[] = [];
    for (const file of files) {
      if (file.type !== 'video/mp4') {
        toast.error(`${file.name}: Only MP4 format is allowed`);
        continue;
      }
      if (file.size > 100 * 1024 * 1024) {
        toast.error(`${file.name}: Maximum size is 100MB`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setVideoFiles(prev => [...prev, ...validFiles]);
    
    // Create previews for new files and append to existing previews
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setVideoPreviews(prev => [...existingVideos, ...prev.slice(existingVideos.length), ...newPreviews]);
  };

  const removeVideo = (index: number) => {
    // Check if it's an existing video or new file
    if (index < existingVideos.length) {
      setExistingVideos(prev => prev.filter((_, i) => i !== index));
    } else {
      const fileIndex = index - existingVideos.length;
      setVideoFiles(prev => prev.filter((_, i) => i !== fileIndex));
    }
    
    setVideoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormValues) => {
    const totalImages = existingImages.length + imageFiles.length;
    
    if (totalImages === 0) {
      toast.error('Please upload at least one image');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload new images if any
      let newImageUrls: string[] = [];
      if (imageFiles.length > 0) {
        newImageUrls = await uploadImagesToStorage(imageFiles, user!.id, 'rooms');
      }

      // Combine existing and new image URLs
      const allImageUrls = [...existingImages, ...newImageUrls];

      // Upload new videos if any
      let newVideoUrls: string[] = [];
      if (videoFiles.length > 0) {
        newVideoUrls = await uploadVideosToStorage(videoFiles, user!.id, 'rooms');
      }

      // Combine existing and new video URLs
      const allVideoUrls = [...existingVideos, ...newVideoUrls];

      // Update room in database
      const isPgHostel = data.propertyType === 'PG_HOSTEL';
      const { error: updateError } = await supabase
        .from('rooms')
        .update({
          title: data.title,
          description: data.description,
          house_no: data.house_no || null,
          house_name: data.house_name || null,
          location: data.location,
          property_type: data.propertyType,
          price: isPgHostel ? (data.pgRent || 0) : (data.price || 0),
          pg_rent: isPgHostel ? (data.pgRent || null) : null,
          hostel_rent: isPgHostel ? (data.hostelRent || null) : null,
          owner_phone: data.owner_phone,
          facilities: {
            wifi: data.wifi === 'yes',
            bathroom: data.bathroom === 'yes',
            laundry: data.laundry === 'yes',
            electricBill: data.electricBill === 'yes',
            gender: data.gender,
            roomType: data.roomType,
            coolingType: data.coolingType === 'none' ? undefined : data.coolingType,
            food: data.food,
          },
          images: allImageUrls,
          videos: allVideoUrls,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', id)
        .eq('owner_id', user!.id);

      if (updateError) {
        console.error('Error updating room:', updateError);
        toast.error('Failed to update room listing');
        return;
      }

      toast.success('Room updated successfully!');
      navigate('/my-listings');
    } catch (error) {
      console.error('Error in onSubmit:', error);
      toast.error('An error occurred while updating the room');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">Edit Room Listing</h1>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <BasicRoomInfoFields control={form.control} />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <ImageUploadSection
                  imageFiles={imageFiles}
                  imagePreviews={imagePreviews}
                  existingImages={existingImages}
                  isSubmitting={isSubmitting}
                  onImageChange={handleImageChange}
                  onRemoveImage={removeImage}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <VideoUploadSection
                  videoFiles={videoFiles}
                  videoPreviews={videoPreviews}
                  existingVideos={existingVideos}
                  isSubmitting={isSubmitting}
                  onVideoChange={handleVideoChange}
                  onRemoveVideo={removeVideo}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <RoomPreferencesFields control={form.control} />
              </CardContent>
            </Card>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating Room...
                </>
              ) : (
                'Update Room'
              )}
            </Button>
          </form>
        </Form>
      </div>
    </Layout>
  );
};

export default EditRoom;
