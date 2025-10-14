-- Check and fix existing storage policies for rooms bucket

-- Drop all existing room-related policies
DROP POLICY IF EXISTS "Authenticated users can upload room images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view room images" ON storage.objects;
DROP POLICY IF EXISTS "Owners can delete their room images" ON storage.objects;
DROP POLICY IF EXISTS "Owners can update their room images" ON storage.objects;

-- Create new comprehensive policies for rooms bucket

-- Allow any authenticated user to upload to rooms bucket
CREATE POLICY "rooms_insert_authenticated"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'rooms');

-- Allow public to view room images
CREATE POLICY "rooms_select_public"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'rooms');

-- Allow authenticated users to delete their own uploads
CREATE POLICY "rooms_delete_own"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'rooms' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own uploads
CREATE POLICY "rooms_update_own"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'rooms' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'rooms' AND
  (storage.foldername(name))[1] = auth.uid()::text
);