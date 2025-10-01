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
 * Compress image file for faster upload and prevent memory issues
 * Reduced to 1080px max width to prevent crashes on low-memory devices
 */
const compressImage = (file: File, maxWidth: number = 1080, quality: number = 0.8): Promise<File> => {
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
 * Check camera permissions for both native and web platforms
 */
const checkCameraPermissions = async (): Promise<boolean> => {
  try {
    if (Capacitor.isNativePlatform()) {
      // Native platform - use Capacitor permissions
      const permissions = await Camera.checkPermissions();
      console.log('Native camera permissions:', permissions);
      
      if (permissions.camera === 'granted' && permissions.photos === 'granted') {
        return true;
      }
      
      if (permissions.camera === 'denied' || permissions.photos === 'denied') {
        toast.error('⚠️ Camera permission denied. Please enable camera access in your device settings.');
        return false;
      }
      
      // Request permissions if not granted
      const requestResult = await Camera.requestPermissions();
      console.log('Permission request result:', requestResult);
      
      if (requestResult.camera === 'granted' && requestResult.photos === 'granted') {
        return true;
      }
      
      toast.error('⚠️ Camera permission required to upload meter photo.');
      return false;
    } else {
      // Web platform
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('Camera API not available');
        return false;
      }

      // Check if we already have permission
      const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
      
      if (permissionStatus.state === 'granted') {
        return true;
      }
      
      if (permissionStatus.state === 'denied') {
        toast.error('⚠️ Camera permission denied. Please enable camera access in your browser settings.');
        return false;
      }

      // Try to request permission by accessing camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        // Stop the stream immediately as we just needed permission
        stream.getTracks().forEach(track => track.stop());
        return true;
      } catch (permError) {
        console.error('Camera permission error:', permError);
        toast.error('⚠️ Camera permission required to upload meter photo. Please enable it in settings.');
        return false;
      }
    }
  } catch (error) {
    console.error('Error checking camera permissions:', error);
    return false;
  }
};

/**
 * Take photo using device camera with proper web/mobile support
 */
export const takeMeterPhoto = async (): Promise<File | null> => {
  try {
    console.log('Taking meter photo - Platform:', Capacitor.isNativePlatform() ? 'Native' : 'Web');

    if (Capacitor.isNativePlatform()) {
      // Check and request permissions first
      const hasPermission = await checkCameraPermissions();
      if (!hasPermission) {
        return null;
      }

      // Native mobile platform - use Capacitor Camera
      try {
        const image = await Camera.getPhoto({
          quality: 80, // Reduced quality for smaller file size
          allowEditing: false,
          resultType: CameraResultType.Uri,
          source: CameraSource.Camera,
          saveToGallery: false, // Don't save to gallery to reduce memory usage
        });

        console.log('Camera result:', { webPath: image.webPath, path: image.path });

        if (!image.webPath && !image.path && !image.base64String) {
          console.error('No image data captured from native camera');
          toast.error('⚠️ No image captured. Please try again.');
          return null;
        }

        // Use webPath or fallback to base64
        const imagePath = image.webPath || `data:image/jpeg;base64,${image.base64String}`;
        
        // Convert to File object with error handling
        try {
          const response = await fetch(imagePath);
          if (!response.ok) {
            throw new Error('Failed to fetch image data');
          }
          
          const blob = await response.blob();
          if (blob.size === 0) {
            throw new Error('Empty image data');
          }
          
          const file = new File([blob], `meter-photo-${Date.now()}.jpg`, {
            type: 'image/jpeg',
          });

          console.log('Native camera photo captured:', file.name, file.size);
          return file;
        } catch (fetchError) {
          console.error('Error converting image to file:', fetchError);
          toast.error('⚠️ Failed to process captured image. Please try again.');
          return null;
        }
      } catch (nativeError: any) {
        console.error('Native camera error:', nativeError);
        
        // Handle specific error cases
        if (nativeError.message?.includes('User cancelled')) {
          console.log('User cancelled camera');
          return null;
        }
        
        toast.error('⚠️ Unable to access camera. Please check permissions in device settings.');
        return null;
      }
    } else {
      // Web platform - check permissions first
      const hasPermission = await checkCameraPermissions();
      if (!hasPermission) {
        return null;
      }

      // Use file input with camera capture for web
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment'; // Use rear camera
        
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            console.log('Web camera photo selected:', file.name, file.size);
            resolve(file);
          } else {
            console.log('No file selected from camera input');
            resolve(null);
          }
        };
        
        input.onclick = () => {
          console.log('Camera input clicked');
        };

        input.oncancel = () => {
          console.log('Camera input cancelled');
          resolve(null);
        };
        
        // Trigger the file input
        input.click();
      });
    }
  } catch (error) {
    console.error('Error taking photo:', error);
    toast.error('⚠️ Unable to access camera. Please try again or check permissions.');
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

    // Validate file
    if (!file || file.size === 0) {
      console.error('Invalid file provided');
      toast.error('⚠️ Invalid image file. Please try again.');
      return null;
    }

    // Check file size (max 10MB before compression)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      console.error('File too large:', file.size);
      toast.error('⚠️ Image file is too large. Please choose a smaller image.');
      return null;
    }

    // Compress image for faster upload and prevent memory issues
    let compressedFile: File;
    try {
      compressedFile = await compressImage(file);
      console.log('Image compressed:', { 
        originalSize: file.size, 
        compressedSize: compressedFile.size 
      });
    } catch (compressionError) {
      console.error('Error compressing image:', compressionError);
      toast.error('⚠️ Failed to process image. Please try again.');
      return null;
    }

    // Upload to storage with timeout
    let uploadedUrls: string[];
    try {
      const uploadPromise = uploadImagesToStorage([compressedFile], renterId, 'user-uploads');
      const timeoutPromise = new Promise<string[]>((_, reject) => 
        setTimeout(() => reject(new Error('Upload timeout')), 60000) // 60 second timeout
      );
      
      uploadedUrls = await Promise.race([uploadPromise, timeoutPromise]);
    } catch (uploadError: any) {
      console.error('Error uploading to storage:', uploadError);
      
      if (uploadError.message === 'Upload timeout') {
        toast.error('⚠️ Upload is taking too long. Please check your internet connection and try again.');
      } else {
        toast.error('⚠️ Failed to upload image. Please check your internet connection.');
      }
      return null;
    }
    
    if (!uploadedUrls || uploadedUrls.length === 0) {
      console.error('No URLs returned from storage upload');
      toast.error('⚠️ Upload failed. Please try again.');
      return null;
    }

    const photoUrl = uploadedUrls[0];
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

    // Save meter photo record to database
    try {
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
        toast.error('⚠️ Failed to save meter photo record. Please try again.');
        return null;
      }

      console.log('Meter photo uploaded and saved successfully:', data);
      toast.success('✅ Meter photo sent to owner successfully! 📸');
      return photoUrl;
    } catch (dbError) {
      console.error('Database error saving meter photo:', dbError);
      toast.error('⚠️ Failed to save meter photo. Please try again.');
      return null;
    }
  } catch (error: any) {
    console.error('Unexpected error in meter photo upload:', error);
    
    // Provide user-friendly error messages
    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      toast.error('⚠️ Network error. Please check your internet connection and try again.');
    } else {
      toast.error('⚠️ Failed to upload meter photo. Please try again.');
    }
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