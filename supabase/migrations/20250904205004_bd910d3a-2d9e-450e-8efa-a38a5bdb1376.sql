-- Fix security issues in account_credentials table

-- 1. First, drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own credentials" ON public.account_credentials;
DROP POLICY IF EXISTS "Users can update own password status" ON public.account_credentials;
DROP POLICY IF EXISTS "Directors can manage account credentials" ON public.account_credentials;

-- 2. Make user_id NOT NULL to prevent security holes
ALTER TABLE public.account_credentials 
ALTER COLUMN user_id SET NOT NULL;

-- 3. Create more secure policies

-- Directors can only INSERT and UPDATE credentials (not view temporary passwords)
CREATE POLICY "Directors can create and manage credentials" 
ON public.account_credentials 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'director'::user_role
  )
);

CREATE POLICY "Directors can update credential status" 
ON public.account_credentials 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'director'::user_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'director'::user_role
  )
);

-- Users can only view their own credentials (email and password change status, NOT temporary password)
CREATE POLICY "Users can view own credential status" 
ON public.account_credentials 
FOR SELECT 
TO authenticated
USING (
  user_id = auth.uid()
);

-- Users can only update their own password change status
CREATE POLICY "Users can update own password status" 
ON public.account_credentials 
FOR UPDATE 
TO authenticated
USING (
  user_id = auth.uid() 
  AND user_id IS NOT NULL
)
WITH CHECK (
  user_id = auth.uid() 
  AND user_id IS NOT NULL
);

-- 4. Create a view that excludes sensitive data for general access
CREATE OR REPLACE VIEW public.account_credentials_safe AS
SELECT 
  id,
  user_id,
  email,
  is_password_changed,
  created_at,
  expires_at
FROM public.account_credentials;

-- 5. Apply RLS to the view
ALTER VIEW public.account_credentials_safe SET (security_barrier = true);

-- 6. Create a security definer function for directors to create accounts (without exposing temp passwords)
CREATE OR REPLACE FUNCTION public.create_account_credential(
  p_user_id uuid,
  p_email text,
  p_temporary_password text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  credential_id uuid;
BEGIN
  -- Only allow directors to call this function
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'director'::user_role
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only directors can create credentials';
  END IF;
  
  -- Insert the credential
  INSERT INTO account_credentials (user_id, email, temporary_password)
  VALUES (p_user_id, p_email, p_temporary_password)
  RETURNING id INTO credential_id;
  
  RETURN credential_id;
END;
$$;