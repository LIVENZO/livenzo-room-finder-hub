-- Create UPI details table for owners
CREATE TABLE public.owner_upi_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  upi_id TEXT NOT NULL,
  qr_code_url TEXT,
  qr_code_file_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create manual payments table for UPI direct payments
CREATE TABLE public.manual_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  renter_id UUID NOT NULL,
  owner_id UUID NOT NULL,
  relationship_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  transaction_id TEXT,
  proof_image_url TEXT,
  proof_file_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.owner_upi_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for owner_upi_details
CREATE POLICY "Owners can manage their own UPI details" 
ON public.owner_upi_details 
FOR ALL 
USING (owner_id = auth.uid());

CREATE POLICY "Renters can view their owner's UPI details" 
ON public.owner_upi_details 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.relationships 
    WHERE owner_id = owner_upi_details.owner_id 
    AND renter_id = auth.uid() 
    AND status = 'accepted'
    AND archived = false
  )
);

-- RLS policies for manual_payments
CREATE POLICY "Renters can create and view their own manual payments" 
ON public.manual_payments 
FOR ALL 
USING (renter_id = auth.uid());

CREATE POLICY "Owners can view and update manual payments from their renters" 
ON public.manual_payments 
FOR ALL 
USING (owner_id = auth.uid());

-- Add triggers for updated_at columns
CREATE TRIGGER update_owner_upi_details_updated_at
BEFORE UPDATE ON public.owner_upi_details
FOR EACH ROW
EXECUTE FUNCTION public.update_modified_column();

CREATE TRIGGER update_manual_payments_updated_at
BEFORE UPDATE ON public.manual_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_modified_column();