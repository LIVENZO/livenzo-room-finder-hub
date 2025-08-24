-- Drop existing storage policies for user-uploads if they exist
DROP POLICY IF EXISTS "Public can read user uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to their folder in user-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their files in user-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their files in user-uploads" ON storage.objects;

-- Storage RLS policies for user-uploads bucket
-- Allow public read (bucket is public)
CREATE POLICY "Public can read user uploads"
ON storage.objects
FOR SELECT
USING (bucket_id = 'user-uploads');

-- Allow authenticated users to upload files with their uid in filename prefix
CREATE POLICY "Users can upload to user-uploads"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'user-uploads'
  AND auth.uid() IS NOT NULL
  AND name ~ ('^' || auth.uid()::text || '.*')
);

-- Allow users to update their own files
CREATE POLICY "Users can update their files in user-uploads"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'user-uploads'
  AND name ~ ('^' || auth.uid()::text || '.*')
)
WITH CHECK (
  bucket_id = 'user-uploads'
  AND name ~ ('^' || auth.uid()::text || '.*')
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their files in user-uploads"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'user-uploads'
  AND name ~ ('^' || auth.uid()::text || '.*')
);