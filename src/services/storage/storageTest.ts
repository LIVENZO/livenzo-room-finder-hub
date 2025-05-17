
import { supabase } from '@/integrations/supabase/client';

/**
 * Tests if the storage service is accessible with current session
 * @param bucketName - The bucket name to test access for
 * @returns A boolean indicating whether storage is accessible
 */
export const testStorageAccess = async (bucketName: string = 'rooms'): Promise<boolean> => {
  try {
    // Get the current session
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData.session) {
      console.error('No active session for storage access test');
      return false;
    }
    
    const session = sessionData.session;
    
    // Try to list buckets first as a basic permission test
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return false;
    }
    
    // Check if bucket exists
    const bucketExists = buckets?.some(b => b.name === bucketName);
    
    // If bucket doesn't exist, try to create it
    if (!bucketExists) {
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 10485760 // 10MB limit
      });
      
      if (createError) {
        console.error(`Error creating "${bucketName}" bucket:`, createError);
        return false;
      }
      
      // Allow time for the bucket to be created
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Try to upload a tiny test file to confirm access
    const testContent = new Blob(['test'], { type: 'text/plain' });
    const testFilename = `access-test-${Date.now()}.txt`;
    const testPath = `${session.user.id}/${testFilename}`;
    
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(testPath, testContent, { upsert: true });
      
    if (uploadError) {
      console.error('Storage access test upload failed:', uploadError);
      return false;
    }
    
    // Try to get URL for the test file
    const { data: urlData } = await supabase.storage
      .from(bucketName)
      .getPublicUrl(testPath);
      
    if (!urlData || !urlData.publicUrl) {
      console.error('Failed to get public URL for test file');
      return false;
    }
    
    // Cleanup test file
    await supabase.storage.from(bucketName).remove([testPath]);
    
    console.log('Storage access test successful');
    return true;
  } catch (error) {
    console.error('Storage access test error:', error);
    return false;
  }
};
