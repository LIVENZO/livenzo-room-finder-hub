import { supabase } from '@/integrations/supabase/client';
import { uploadImagesToStorage } from './storage/supabaseStorage';
import { toast } from 'sonner';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export interface MeterPhoto {
  id: string;
  relationship_id: string;
  renter_id: string;
  owner_id: string;
  photo_url: string;
  photo_name: string;
  file_size: number;
  billing_month: string;
  created_at: string;
  updated_at: string;
}

/**
 * Compress image file for faster upload
 */
const compressImage = (file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      const aspectRatio = img.width / img.height;
      let { width, height } = img;
      
      if (width > maxWidth) {
        width = maxWidth;
        height = width / aspectRatio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          resolve(compressedFile);
        } else {
          resolve(file);
        }
      }, 'image/jpeg', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Take photo using device camera (mobile native)
 */
export const takeMeterPhoto = async (): Promise<File | null> => {
  try {
    if (!Capacitor.isNativePlatform()) {
      // Fallback for web - trigger file input
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'camera';
        
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          resolve(file || null);
        };
        
        input.click();
      });
    }

    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
    });

    if (!image.webPath) {
      throw new Error('No image captured');
    }

    // Convert to File object
    const response = await fetch(image.webPath);
    const blob = await response.blob();
    const file = new File([blob], `meter-photo-${Date.now()}.jpg`, {
      type: 'image/jpeg',
    });

    return file;
  } catch (error) {
    console.error('Error taking photo:', error);
    toast.error('Failed to take photo');
    return null;
  }
};

/**
 * Choose photo from gallery (mobile native)
 */
export const chooseMeterPhotoFromGallery = async (): Promise<File | null> => {
  try {
    if (!Capacitor.isNativePlatform()) {
      // Fallback for web - trigger file input
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          resolve(file || null);
        };
        
        input.click();
      });
    }

    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Photos,
    });

    if (!image.webPath) {
      throw new Error('No image selected');
    }

    // Convert to File object
    const response = await fetch(image.webPath);
    const blob = await response.blob();
    const file = new File([blob], `meter-photo-${Date.now()}.jpg`, {
      type: 'image/jpeg',
    });

    return file;
  } catch (error) {
    console.error('Error choosing photo:', error);
    toast.error('Failed to choose photo');
    return null;
  }
};

/**
 * Upload meter photo for current billing month
 */
export const uploadMeterPhoto = async (
  file: File,
  relationshipId: string,
  renterId: string,
  ownerId: string
): Promise<string | null> => {
  try {
    console.log('Starting meter photo upload...', { 
      fileName: file.name, 
      fileSize: file.size,
      relationshipId,
      renterId,
      ownerId
    });

    // Compress image for faster upload
    const compressedFile = await compressImage(file);
    console.log('Image compressed:', { 
      originalSize: file.size, 
      compressedSize: compressedFile.size 
    });

    // Upload to storage
    const uploadedUrls = await uploadImagesToStorage([compressedFile], renterId, 'user-uploads');
    
    if (uploadedUrls.length === 0) {
      console.error('No URLs returned from storage upload');
      return null;
    }

    const photoUrl = uploadedUrls[0];
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

    // Save meter photo record to database
    const { data, error } = await supabase
      .from('meter_photos')
      .insert({
        relationship_id: relationshipId,
        renter_id: renterId,
        owner_id: ownerId,
        photo_url: photoUrl,
        photo_name: compressedFile.name,
        file_size: compressedFile.size,
        billing_month: currentMonth
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving meter photo record:', error);
      toast.error('Failed to save meter photo record');
      return null;
    }

    console.log('Meter photo uploaded and saved successfully:', data);
    toast.success('Meter photo sent to owner successfully! 📸');
    return photoUrl;
  } catch (error) {
    console.error('Error in meter photo upload:', error);
    toast.error('Failed to upload meter photo');
    return null;
  }
};

/**
 * Get meter photos for a relationship in current billing month
 */
export const getMeterPhotos = async (relationshipId: string): Promise<MeterPhoto[]> => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    const { data, error } = await supabase
      .from('meter_photos')
      .select('*')
      .eq('relationship_id', relationshipId)
      .eq('billing_month', currentMonth)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching meter photos:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getMeterPhotos:', error);
    return [];
  }
};

/**
 * Get all meter photos for an owner (across all their renters)
 */
export const getOwnerMeterPhotos = async (ownerId: string): Promise<Record<string, MeterPhoto[]>> => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    const { data, error } = await supabase
      .from('meter_photos')
      .select('*')
      .eq('owner_id', ownerId)
      .eq('billing_month', currentMonth)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching owner meter photos:', error);
      return {};
    }

    // Group photos by relationship_id
    const photosByRelationship: Record<string, MeterPhoto[]> = {};
    (data || []).forEach(photo => {
      if (!photosByRelationship[photo.relationship_id]) {
        photosByRelationship[photo.relationship_id] = [];
      }
      photosByRelationship[photo.relationship_id].push(photo);
    });

    return photosByRelationship;
  } catch (error) {
    console.error('Error in getOwnerMeterPhotos:', error);
    return {};
  }
};