import { supabase } from '@/integrations/supabase/client';
import { uploadImagesToStorage } from './storage/supabaseStorage';
import { toast } from 'sonner';

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

    // Upload to storage
    const uploadedUrls = await uploadImagesToStorage([file], renterId, 'user-uploads');
    
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
        photo_name: file.name,
        file_size: file.size,
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