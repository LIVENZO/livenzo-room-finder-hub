-- Fix storage policies for property-images bucket

-- Drop any existing policies for property-images
DROP POLICY IF EXISTS "property_images_insert_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "property_images_select_public" ON storage.objects;
DROP POLICY IF EXISTS "property_images_delete_own" ON storage.objects;
DROP POLICY IF EXISTS "property_images_update_own" ON storage.objects;

-- Allow authenticated users to upload property images
CREATE POLICY "property_images_insert_authenticated"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'property-images');

-- Allow public to view property images
CREATE POLICY "property_images_select_public"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'property-images');

-- Allow authenticated users to delete their own property images
CREATE POLICY "property_images_delete_own"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own property images
CREATE POLICY "property_images_update_own"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'property-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'property-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);