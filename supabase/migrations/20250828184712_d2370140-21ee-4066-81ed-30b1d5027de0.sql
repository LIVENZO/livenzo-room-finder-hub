-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policy for users to upload their own files to user-uploads bucket
CREATE POLICY "Users can upload their own files to user-uploads"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'user-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy for users to view their own files in user-uploads bucket
CREATE POLICY "Users can view their own files in user-uploads"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'user-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy for users to update their own files in user-uploads bucket
CREATE POLICY "Users can update their own files in user-uploads"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'user-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy for users to delete their own files in user-uploads bucket
CREATE POLICY "Users can delete their own files in user-uploads"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'user-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to user-uploads since it's a public bucket
CREATE POLICY "Public can view files in user-uploads"
ON storage.objects
FOR SELECT
USING (bucket_id = 'user-uploads');