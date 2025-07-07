-- Fix function search path security warnings by setting search_path parameter

-- Update check_low_stock function to have immutable search_path
CREATE OR REPLACE FUNCTION public.check_low_stock()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- Check if stock is below minimum
  IF NEW.current_stock <= NEW.minimum_stock THEN
    -- Delete any existing alerts for this item
    DELETE FROM public.low_stock_alerts WHERE item_id = NEW.id AND is_acknowledged = false;
    
    -- Create new alert
    INSERT INTO public.low_stock_alerts (item_id, current_stock, minimum_stock, alert_level)
    VALUES (
      NEW.id,
      NEW.current_stock,
      NEW.minimum_stock,
      CASE 
        WHEN NEW.current_stock = 0 THEN 'out_of_stock'
        WHEN NEW.current_stock <= (NEW.minimum_stock * 0.5) THEN 'critical'
        ELSE 'low'
      END
    );
  ELSE
    -- Remove any existing alerts if stock is above minimum
    DELETE FROM public.low_stock_alerts WHERE item_id = NEW.id AND is_acknowledged = false;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update update_updated_at_column function to have immutable search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- Update get_user_role function to have immutable search_path
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
 RETURNS user_role
 LANGUAGE sql
 STABLE 
 SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT role FROM public.profiles WHERE id = user_id;
$function$;

-- Update handle_new_user function to have immutable search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  invitation_record RECORD;
BEGIN
  -- Log the new user creation
  RAISE LOG 'New user created: %, email confirmed: %', NEW.id, NEW.email_confirmed_at IS NOT NULL;
  
  -- Only create profile if email is confirmed
  IF NEW.email_confirmed_at IS NOT NULL THEN
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
      -- First confirmed user becomes director, others without invitation get rejected
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
        RAISE LOG 'No invitation found for confirmed user: %, profile not created', NEW.email;
        -- Don't create profile for users without invitations
      END IF;
    END IF;
  ELSE
    RAISE LOG 'User created but email not confirmed yet: %', NEW.email;
  END IF;
  
  RETURN NEW;
END;
$function$;