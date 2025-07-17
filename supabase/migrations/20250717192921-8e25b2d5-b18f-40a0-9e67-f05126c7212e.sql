-- Create fuel entries table for daily stock tracking
CREATE TABLE public.fuel_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  attendant_id UUID NOT NULL,
  opening_stock NUMERIC NOT NULL,
  closing_stock NUMERIC NOT NULL,
  fuel_sold NUMERIC GENERATED ALWAYS AS (opening_stock - closing_stock) STORED,
  revenue_received NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'approved_by_accountant', 'approved_by_manager')),
  approved_by_accountant UUID,
  approved_by_manager UUID,
  accountant_approved_at TIMESTAMP WITH TIME ZONE,
  manager_approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  fuel_type TEXT NOT NULL DEFAULT 'petrol',
  notes TEXT
);

-- Create invoices table for bulk fuel purchases
CREATE TABLE public.fuel_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  fuel_quantity NUMERIC NOT NULL,
  fuel_type TEXT NOT NULL DEFAULT 'petrol',
  price_per_liter NUMERIC NOT NULL,
  total_amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  due_date DATE,
  notes TEXT
);

-- Create lubricant sales table
CREATE TABLE public.lubricant_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit_price NUMERIC NOT NULL,
  total_amount NUMERIC NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  category TEXT DEFAULT 'lubricant' CHECK (category IN ('lubricant', 'gas_cylinder')),
  notes TEXT
);

-- Enable RLS on all tables
ALTER TABLE public.fuel_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lubricant_sales ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fuel_entries
CREATE POLICY "Fuel attendants can create entries" 
ON public.fuel_entries 
FOR INSERT 
WITH CHECK (
  auth.uid() = attendant_id AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'fuel_cashier'
    AND department = 'fuel'
  )
);

CREATE POLICY "Everyone can view fuel entries" 
ON public.fuel_entries 
FOR SELECT 
USING (true);

CREATE POLICY "Accountants and managers can update entries" 
ON public.fuel_entries 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('accountant', 'manager', 'director')
  )
);

-- RLS Policies for fuel_invoices
CREATE POLICY "Fuel attendants can create invoices" 
ON public.fuel_invoices 
FOR INSERT 
WITH CHECK (
  auth.uid() = created_by AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'fuel_cashier'
    AND department = 'fuel'
  )
);

CREATE POLICY "Everyone can view invoices" 
ON public.fuel_invoices 
FOR SELECT 
USING (true);

CREATE POLICY "Fuel attendants can update their invoices" 
ON public.fuel_invoices 
FOR UPDATE 
USING (
  auth.uid() = created_by OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('accountant', 'manager', 'director')
  )
);

-- RLS Policies for lubricant_sales
CREATE POLICY "Fuel attendants can create lubricant sales" 
ON public.lubricant_sales 
FOR INSERT 
WITH CHECK (
  auth.uid() = created_by AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'fuel_cashier'
    AND department = 'fuel'
  )
);

CREATE POLICY "Everyone can view lubricant sales" 
ON public.lubricant_sales 
FOR SELECT 
USING (true);

CREATE POLICY "Fuel attendants can update their sales" 
ON public.lubricant_sales 
FOR UPDATE 
USING (
  auth.uid() = created_by OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('accountant', 'manager', 'director')
  )
);

-- Add updated_at triggers
CREATE TRIGGER update_fuel_entries_updated_at
  BEFORE UPDATE ON public.fuel_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fuel_invoices_updated_at
  BEFORE UPDATE ON public.fuel_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lubricant_sales_updated_at
  BEFORE UPDATE ON public.lubricant_sales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();