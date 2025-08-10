-- Fix RLS policy for fuel_entries to allow directors to create entries
-- and implement proper approval workflow

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Fuel attendants can create entries" ON public.fuel_entries;

-- Create a more flexible policy that allows fuel cashiers, managers, and directors to create entries
CREATE POLICY "Fuel staff can create entries" 
ON public.fuel_entries 
FOR INSERT 
WITH CHECK (
  (auth.uid() = attendant_id) AND 
  (EXISTS ( 
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (
      (profiles.role = 'fuel_cashier'::user_role AND profiles.department = 'fuel'::department) OR
      profiles.role = 'director'::user_role OR
      profiles.role = 'manager'::user_role
    )
  ))
);