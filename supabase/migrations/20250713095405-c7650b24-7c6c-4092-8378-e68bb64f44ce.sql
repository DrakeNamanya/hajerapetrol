-- Update the sales INSERT policy to be more permissive for directors and managers
DROP POLICY IF EXISTS "Users can create sales in their department" ON public.sales;

CREATE POLICY "Users can create sales in their department" 
ON public.sales 
FOR INSERT 
WITH CHECK (
  auth.uid() = created_by AND (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (
        profiles.role = ANY (ARRAY['director'::user_role, 'manager'::user_role, 'accountant'::user_role])
        OR profiles.department::text = sales.department
      )
    )
  )
);