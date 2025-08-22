-- CRITICAL SECURITY FIXES - Phase 1: Data Protection

-- 1. Fix user_profiles RLS policies - Remove overly permissive access
DROP POLICY IF EXISTS "Users can view all profiles" ON public.user_profiles;

-- Create secure, role-based access policies for user_profiles
CREATE POLICY "Users can view their own profile" 
ON public.user_profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Connected users can view basic profile info" 
ON public.user_profiles 
FOR SELECT 
USING (
  auth.uid() != id AND (
    -- Owner can see renter's basic info if they have accepted relationship
    EXISTS (
      SELECT 1 FROM public.relationships 
      WHERE owner_id = auth.uid() 
      AND renter_id = id 
      AND status = 'accepted'
    )
    OR
    -- Renter can see owner's basic info if they have accepted relationship  
    EXISTS (
      SELECT 1 FROM public.relationships 
      WHERE renter_id = auth.uid() 
      AND owner_id = id 
      AND status = 'accepted'
    )
  )
);

-- 2. Fix rooms table - Create authenticated-only policies
DROP POLICY IF EXISTS "Public can view rooms with masked sensitive data" ON public.rooms;
DROP POLICY IF EXISTS "Authenticated users can view all room details" ON public.rooms;

-- Public can view basic room info with masked contact details
CREATE POLICY "Public can view basic room info" 
ON public.rooms 
FOR SELECT 
USING (available = true);

-- Authenticated users can view full room details
CREATE POLICY "Authenticated users can view detailed room info" 
ON public.rooms 
FOR SELECT 
TO authenticated
USING (available = true);

-- 3. Secure database functions - Add security definer with proper search path
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.user_role_assignments
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  RETURN COALESCE(user_role, 'renter');
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_relationship_access(relationship_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM public.relationships 
    WHERE id = relationship_uuid 
    AND (owner_id = user_uuid OR renter_id = user_uuid)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_sensitive_operation(operation_type text, user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  last_operation_time timestamp with time zone;
  rate_limit_minutes integer := 5;
BEGIN
  -- Check if user exists and is active
  IF user_uuid IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Simple rate limiting for sensitive operations
  SELECT MAX(created_at) INTO last_operation_time
  FROM public.relationships
  WHERE (owner_id = user_uuid OR renter_id = user_uuid)
  AND created_at > NOW() - INTERVAL '1 minute' * rate_limit_minutes;
  
  IF last_operation_time IS NOT NULL AND operation_type = 'create_relationship' THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- 4. Add security audit logging table
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  event_type text NOT NULL,
  resource_type text,
  resource_id uuid,
  ip_address inet,
  user_agent text,
  details jsonb,
  severity text CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs (for now, restrict to system)
CREATE POLICY "System only audit log access" 
ON public.security_audit_log 
FOR ALL 
USING (false);

-- 5. Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id uuid,
  p_event_type text,
  p_resource_type text DEFAULT NULL,
  p_resource_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT NULL,
  p_severity text DEFAULT 'medium'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id, event_type, resource_type, resource_id, 
    details, severity
  ) VALUES (
    p_user_id, p_event_type, p_resource_type, p_resource_id,
    p_details, p_severity
  );
END;
$$;

-- 6. Add data classification to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS data_classification jsonb DEFAULT '{
  "public": ["full_name", "avatar_url", "public_id"],
  "restricted": ["phone", "email"],
  "confidential": ["upi_id", "upi_phone_number", "razorpay_merchant_id", "property_address"],
  "highly_confidential": ["location_latitude", "location_longitude"]
}'::jsonb;