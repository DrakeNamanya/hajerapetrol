
-- Fix the handle_new_user function to properly handle invitations
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation_record RECORD;
BEGIN
  -- Log the new user creation
  RAISE LOG 'New user created: %', NEW.id;
  
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
    RAISE LOG 'Found invitation for user: %, role: %', NEW.email, invitation_record.role;
    
    INSERT INTO public.profiles (id, email, full_name, role, department, created_by)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
      invitation_record.role,
      invitation_record.department,
      invitation_record.invited_by
    );
    
    -- Mark invitation as accepted
    UPDATE public.team_invitations 
    SET accepted_at = NOW() 
    WHERE id = invitation_record.id;
    
    RAISE LOG 'Profile created and invitation accepted for user: %', NEW.email;
  ELSE
    -- First user becomes director, others without invitation get rejected
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'director') THEN
      RAISE LOG 'Creating first director user: %', NEW.email;
      
      INSERT INTO public.profiles (id, email, full_name, role, department)
      VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
        'director',
        'executive'
      );
    ELSE
      RAISE LOG 'No invitation found for user: %, profile not created', NEW.email;
      -- Don't create profile for users without invitations
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
