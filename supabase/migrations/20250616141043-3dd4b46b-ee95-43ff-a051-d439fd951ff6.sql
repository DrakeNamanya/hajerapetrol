
-- Add a table to store temporary credentials for new accounts
CREATE TABLE public.account_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  temporary_password TEXT NOT NULL,
  is_password_changed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 days')
);

-- Enable RLS on account_credentials
ALTER TABLE public.account_credentials ENABLE ROW LEVEL SECURITY;

-- Only directors can manage account credentials
CREATE POLICY "Directors can manage account credentials" 
  ON public.account_credentials 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'director'
    )
  );

-- Users can view their own credentials
CREATE POLICY "Users can view own credentials" 
  ON public.account_credentials 
  FOR SELECT 
  USING (user_id = auth.uid());

-- Users can update their own password change status
CREATE POLICY "Users can update own password status" 
  ON public.account_credentials 
  FOR UPDATE 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Add a deleted_at column to profiles for soft deletion
ALTER TABLE public.profiles ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;

-- Create an edge function to create complete user accounts
-- This will be implemented in the code changes
