import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Layout from '@/components/Layout';
import { uploadImagesToStorage } from '@/services/storage';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formSchema, FormValues } from '@/components/room-listing/schemas/roomListingSchema';
import BasicRoomInfoFields from '@/components/room-listing/BasicRoomInfoFields';
import RoomPreferencesFields from '@/components/room-listing/RoomPreferencesFields';
import ImageUploadSection from '@/components/room-listing/ImageUploadSection';
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
      wifi: false,
      bathroom: false,
      owner_phone: '',
    },
  });

  // Load existing room data
  useEffect(() => {
    if (!user || !id) return;
    
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

        // Parse facilities
        const facilities = parseFacilities(data.facilities);

        // Set form values
        form.reset({
          title: data.title,
          description: data.description,
          house_no: data.house_no || '',
          house_name: data.house_name || '',
          location: data.location,
          price: Number(data.price),
          gender: facilities.gender || 'any',
          roomType: facilities.roomType || 'single',
          coolingType: facilities.coolingType,
          wifi: facilities.wifi || false,
          bathroom: facilities.bathroom || false,
          owner_phone: data.owner_phone,
        });

        // Set existing images
        if (data.images && Array.isArray(data.images)) {
          setExistingImages(data.images);
          setImagePreviews(data.images);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error in loadRoomData:', error);
        toast.error('Failed to load room');
        navigate('/my-listings');
      }
    };

    loadRoomData();
  }, [user, id, navigate, form]);

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
    
    // Create previews for new files
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
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

      // Update room in database
      const { error: updateError } = await supabase
        .from('rooms')
        .update({
          title: data.title,
          description: data.description,
          house_no: data.house_no || null,
          house_name: data.house_name || null,
          location: data.location,
          price: data.price,
          owner_phone: data.owner_phone,
          facilities: {
            wifi: data.wifi,
            bathroom: data.bathroom,
            gender: data.gender,
            roomType: data.roomType,
            coolingType: data.coolingType,
          },
          images: allImageUrls,
          updated_at: new Date().toISOString(),
        })
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
                  isSubmitting={isSubmitting}
                  onImageChange={handleImageChange}
                  onRemoveImage={removeImage}
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
