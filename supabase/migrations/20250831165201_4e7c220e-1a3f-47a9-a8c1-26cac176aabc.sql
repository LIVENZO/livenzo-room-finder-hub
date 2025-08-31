-- Create payments table for rent payment system
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  renter_id UUID NOT NULL,
  relationship_id UUID REFERENCES public.relationships(id),
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  payment_method TEXT DEFAULT 'razorpay',
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create policies for payments table
CREATE POLICY "Owners can view payments from their renters" 
ON public.payments 
FOR SELECT 
USING (owner_id = auth.uid());

CREATE POLICY "Renters can view their own payments" 
ON public.payments 
FOR SELECT 
USING (renter_id = auth.uid());

CREATE POLICY "Renters can create payments" 
ON public.payments 
FOR INSERT 
WITH CHECK (renter_id = auth.uid());

CREATE POLICY "Users can update payments" 
ON public.payments 
FOR UPDATE 
USING ((renter_id = auth.uid()) OR (owner_id = auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_modified_column();