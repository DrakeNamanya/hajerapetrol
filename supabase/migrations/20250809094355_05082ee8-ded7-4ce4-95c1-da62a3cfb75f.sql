-- Update the fuel entries INSERT policy to allow directors and managers to also create entries
-- This is needed for testing and management oversight
DROP POLICY "Fuel attendants can create entries" ON public.fuel_entries;

CREATE POLICY "Fuel attendants can create entries" 
ON public.fuel_entries 
FOR INSERT 
WITH CHECK (
  (auth.uid() = attendant_id) AND 
  (EXISTS ( 
    SELECT 1
    FROM profiles
    WHERE (
      (profiles.id = auth.uid()) AND 
      (
        (profiles.role = 'fuel_cashier'::user_role AND profiles.department = 'fuel'::department) OR
        (profiles.role = 'director'::user_role) OR
        (profiles.role = 'manager'::user_role)
      )
    )
  ))
);