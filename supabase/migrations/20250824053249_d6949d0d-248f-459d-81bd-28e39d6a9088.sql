-- Storage RLS policies for user-uploads bucket
-- Allow public read (bucket is public), safe for listing/preview
CREATE POLICY IF NOT EXISTS "Public can read user uploads"
ON storage.objects
FOR SELECT
USING (bucket_id = 'user-uploads');

-- Allow authenticated users to upload only within their own folder (first path segment equals their uid)
CREATE POLICY IF NOT EXISTS "Users can upload to their folder in user-uploads"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'user-uploads'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own files
CREATE POLICY IF NOT EXISTS "Users can update their files in user-uploads"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'user-uploads'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'user-uploads'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own files
CREATE POLICY IF NOT EXISTS "Users can delete their files in user-uploads"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'user-uploads'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
