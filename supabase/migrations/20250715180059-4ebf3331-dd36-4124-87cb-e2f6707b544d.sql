-- Fix RLS policy for fuel cashiers to create sales in their department
DROP POLICY IF EXISTS "Users can create sales in their department" ON public.sales;

CREATE POLICY "Users can create sales in their department" 
ON public.sales 
FOR INSERT 
WITH CHECK (
  auth.uid() = created_by AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (
      -- Directors, managers, and accountants can create sales in any department
      role IN ('director', 'manager', 'accountant') OR 
      -- Cashiers can only create sales in their specific department
      (role = 'fuel_cashier' AND department = 'fuel' AND sales.department = 'fuel') OR
      (role = 'supermarket_cashier' AND department = 'supermarket' AND sales.department = 'supermarket') OR
      (role = 'restaurant_cashier' AND department = 'restaurant' AND sales.department = 'restaurant')
    )
  )
);