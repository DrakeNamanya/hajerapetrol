
-- Create sales table to store all department sales
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  department TEXT NOT NULL CHECK (department IN ('fuel', 'supermarket', 'restaurant')),
  sale_type TEXT NOT NULL,
  customer_name TEXT,
  table_number TEXT,
  pump_number TEXT,
  items JSONB NOT NULL,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  amount_received NUMERIC,
  change_amount NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accountant_approved', 'manager_approved', 'approved', 'rejected')),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_by_accountant UUID,
  approved_by_manager UUID,
  accountant_approved_at TIMESTAMP WITH TIME ZONE,
  manager_approved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Create policies for sales table with proper type casting
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

-- Create indexes for better performance
CREATE INDEX idx_sales_department ON public.sales(department);
CREATE INDEX idx_sales_status ON public.sales(status);
CREATE INDEX idx_sales_created_at ON public.sales(created_at);
CREATE INDEX idx_sales_created_by ON public.sales(created_by);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_sales_updated_at 
    BEFORE UPDATE ON public.sales 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
