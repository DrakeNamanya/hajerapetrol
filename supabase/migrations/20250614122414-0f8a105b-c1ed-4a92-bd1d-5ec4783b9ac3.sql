
-- Enable RLS on expenses table if not already enabled
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create policy that allows authenticated users to view all expenses (needed for approval workflow)
CREATE POLICY "Authenticated users can view expenses" 
  ON public.expenses 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Create policy that allows authenticated users to create expenses
CREATE POLICY "Authenticated users can create expenses" 
  ON public.expenses 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Create policy that allows authenticated users to update expenses (needed for approval workflow)
CREATE POLICY "Authenticated users can update expenses" 
  ON public.expenses 
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- Create policy that allows authenticated users to delete their own expenses
CREATE POLICY "Users can delete their own expenses" 
  ON public.expenses 
  FOR DELETE 
  USING (auth.uid() = requested_by);
