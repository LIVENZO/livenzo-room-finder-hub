ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS maximum_price numeric DEFAULT NULL;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS minimum_price numeric DEFAULT NULL;