
-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM (
  'director',
  'manager', 
  'accountant',
  'fuel_cashier',
  'supermarket_cashier',
  'restaurant_cashier'
);

-- Create enum for departments
CREATE TYPE public.department AS ENUM (
  'executive',
  'management',
  'accounting', 
  'fuel',
  'supermarket',
  'restaurant'
);

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL,
  department department NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT TRUE
);

-- Create team invitations table
CREATE TABLE public.team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role user_role NOT NULL,
  department department NOT NULL,
  invited_by UUID REFERENCES auth.users(id) NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on team_invitations  
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" 
  ON public.profiles FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Directors can insert profiles" 
  ON public.profiles FOR INSERT 
  TO authenticated
  WITH CHECK (get_user_role(auth.uid()) = 'director');

CREATE POLICY "Directors can update profiles" 
  ON public.profiles FOR UPDATE 
  TO authenticated
  USING (get_user_role(auth.uid()) = 'director');

-- RLS Policies for team_invitations
CREATE POLICY "Directors can manage invitations" 
  ON public.team_invitations FOR ALL
  TO authenticated
  USING (get_user_role(auth.uid()) = 'director');

CREATE POLICY "Users can view their own invitations" 
  ON public.team_invitations FOR SELECT
  TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation_record RECORD;
BEGIN
  -- Check if there's a pending invitation for this email
  SELECT * INTO invitation_record 
  FROM public.team_invitations 
  WHERE email = NEW.email 
    AND accepted_at IS NULL 
    AND expires_at > NOW()
  ORDER BY created_at DESC 
  LIMIT 1;

  -- If invitation exists, create profile with invited role
  IF invitation_record IS NOT NULL THEN
    INSERT INTO public.profiles (id, email, full_name, role, department, created_by)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
      invitation_record.role,
      invitation_record.department,
      invitation_record.invited_by
    );
    
    -- Mark invitation as accepted
    UPDATE public.team_invitations 
    SET accepted_at = NOW() 
    WHERE id = invitation_record.id;
  ELSE
    -- First user becomes director, others need invitation
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'director') THEN
      INSERT INTO public.profiles (id, email, full_name, role, department)
      VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
        'director',
        'executive'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
