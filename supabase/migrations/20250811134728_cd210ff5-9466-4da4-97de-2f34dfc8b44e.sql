-- Create table for meter photos
CREATE TABLE public.meter_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  relationship_id UUID NOT NULL,
  renter_id UUID NOT NULL,
  owner_id UUID NOT NULL,
  photo_url TEXT NOT NULL,
  photo_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  billing_month TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.meter_photos ENABLE ROW LEVEL SECURITY;

-- Create policies for meter photos
CREATE POLICY "Renters can upload their own meter photos" 
ON public.meter_photos 
FOR INSERT 
WITH CHECK (renter_id = auth.uid());

CREATE POLICY "Renters can view their own meter photos" 
ON public.meter_photos 
FOR SELECT 
USING (renter_id = auth.uid());

CREATE POLICY "Owners can view meter photos from their renters" 
ON public.meter_photos 
FOR SELECT 
USING (owner_id = auth.uid());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_meter_photos_updated_at
BEFORE UPDATE ON public.meter_photos
FOR EACH ROW
EXECUTE FUNCTION public.update_modified_column();