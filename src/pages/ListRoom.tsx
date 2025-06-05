
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Layout from '@/components/Layout';
import { uploadImagesToStorage } from '@/services/storage';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, UploadCloud, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

// Define the form validation schema
const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  house_no: z.string().optional(),
  house_name: z.string().optional(),
  location: z.string().min(5, "Location must be at least 5 characters"),
  price: z.number().min(1, "Price must be greater than 0"),
  gender: z.enum(['male', 'female', 'any']),
  roomType: z.enum(['single', 'sharing']),
  wifi: z.boolean().default(false),
  bathroom: z.boolean().default(false),
  owner_phone: z.string().min(10, "Phone number must be valid"),
});

type FormValues = z.infer<typeof formSchema>;

const ListRoom: React.FC = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
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
      wifi: false,
      bathroom: false,
      owner_phone: '',
    },
  });
  
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
      
      // Step 1: Upload images to Supabase Storage
      const toastId = toast.loading('Preparing to upload images...');
      
      // Ensure we're using the correct bucket name 'rooms'
      const imageUrls = await uploadImagesToStorage(imageFiles, user.id, 'rooms');
      
      if (imageUrls.length === 0) {
        console.error('Image upload failed - no URLs returned');
        toast.error('Failed to upload images. Please try again or contact support.', { id: toastId });
        setIsSubmitting(false);
        return;
      }
      
      console.log('Images uploaded successfully:', imageUrls);
      toast.loading('Creating room listing...', { id: toastId });
      
      // Step 2: Save room data to Supabase
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
        },
        owner_id: user.id,
        owner_phone: values.owner_phone,
        images: imageUrls,
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
      
      // Step 3: Redirect to my listings
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
                {/* Room Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Spacious Single Room near University" {...field} />
                      </FormControl>
                      <FormDescription>
                        Choose a descriptive title to attract potential renters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Room Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your room in detail, including features, nearby amenities, etc."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide a detailed description of your room and what makes it special
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* House Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="house_no"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>House No.</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 123" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="house_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>House Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Sunshine Apartments" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Location */}
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Near Central Park, New York" {...field} />
                      </FormControl>
                      <FormDescription>
                        Enter a descriptive location to help renters find your property
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Image Upload */}
                <div className="space-y-2">
                  <FormLabel>Room Images</FormLabel>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload"
                      disabled={imageFiles.length >= 5 || isSubmitting}
                    />
                    
                    {imagePreviews.length === 0 ? (
                      <label
                        htmlFor="image-upload"
                        className="flex flex-col items-center justify-center cursor-pointer"
                      >
                        <UploadCloud className="h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-gray-600">Click to upload (max 5 images)</p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP up to 5MB each</p>
                      </label>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-4">
                          {imagePreviews.map((preview, index) => (
                            <div key={index} className="relative">
                              <img
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                className="h-24 w-24 object-cover rounded-lg"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                onClick={() => removeImage(index)}
                                disabled={isSubmitting}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        
                        {imageFiles.length < 5 && (
                          <label
                            htmlFor="image-upload"
                            className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded cursor-pointer"
                          >
                            <UploadCloud className="h-4 w-4 mr-2" />
                            <span>Add more images</span>
                          </label>
                        )}
                      </div>
                    )}
                  </div>
                  <FormDescription>
                    Upload up to 5 high-quality images of your room
                  </FormDescription>
                  {imageFiles.length === 0 && (
                    <p className="text-sm text-destructive">
                      At least one image is required
                    </p>
                  )}
                </div>
                
                {/* Room Cost */}
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Rent</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          min="1"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter the monthly rent amount
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Gender Preference */}
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Gender Preference</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="male" id="gender-male" />
                            <FormLabel htmlFor="gender-male" className="cursor-pointer font-normal">
                              Boys Only
                            </FormLabel>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="female" id="gender-female" />
                            <FormLabel htmlFor="gender-female" className="cursor-pointer font-normal">
                              Girls Only
                            </FormLabel>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="any" id="gender-any" />
                            <FormLabel htmlFor="gender-any" className="cursor-pointer font-normal">
                              Any Gender
                            </FormLabel>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Room Type */}
                <FormField
                  control={form.control}
                  name="roomType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Room Type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex space-x-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="single" id="room-single" />
                            <FormLabel htmlFor="room-single" className="cursor-pointer font-normal">
                              Single Room
                            </FormLabel>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="sharing" id="room-sharing" />
                            <FormLabel htmlFor="room-sharing" className="cursor-pointer font-normal">
                              Sharing Room
                            </FormLabel>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Amenities */}
                <div className="space-y-3">
                  <FormLabel>Amenities</FormLabel>
                  
                  <div className="flex space-x-6">
                    <FormField
                      control={form.control}
                      name="wifi"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>WiFi Available</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="bathroom"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Connected Bathroom</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                {/* Contact Phone */}
                <FormField
                  control={form.control}
                  name="owner_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="Your phone number"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        This number will be visible to potential renters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
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
