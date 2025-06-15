
-- Enable RLS on sales table (should already be enabled but let's make sure)
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to recreate them properly
DROP POLICY IF EXISTS "Users can view sales from their department or if they are accountant/manager/director" ON public.sales;
DROP POLICY IF EXISTS "Users can create sales in their department" ON public.sales;
DROP POLICY IF EXISTS "Accountants and managers can update sales status" ON public.sales;

-- Create comprehensive policies for sales table
CREATE POLICY "Users can view sales from their department or if they are accountant/manager/director" 
  ON public.sales 
  FOR SELECT 
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (role IN ('accountant', 'manager', 'director') OR department::text = sales.department)
    )
  );

CREATE POLICY "Users can create sales in their department" 
  ON public.sales 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (department::text = sales.department OR role IN ('manager', 'director'))
    )
  );

CREATE POLICY "Accountants and managers can update sales status" 
  ON public.sales 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('accountant', 'manager', 'director')
    )
  );
