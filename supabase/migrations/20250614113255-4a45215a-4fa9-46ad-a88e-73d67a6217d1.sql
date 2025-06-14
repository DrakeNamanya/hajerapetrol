
-- Create expenses table to track the approval flow
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  department TEXT NOT NULL,
  requested_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accountant_approved', 'manager_approved', 'director_approved', 'rejected')),
  approved_by_accountant UUID REFERENCES auth.users(id),
  approved_by_manager UUID REFERENCES auth.users(id),
  approved_by_director UUID REFERENCES auth.users(id),
  accountant_approved_at TIMESTAMP WITH TIME ZONE,
  manager_approved_at TIMESTAMP WITH TIME ZONE,
  director_approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT
);

-- Create receipts table for storing receipt data
CREATE TABLE public.receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_number TEXT NOT NULL UNIQUE,
  department TEXT NOT NULL,
  customer_name TEXT,
  items JSONB NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  tax DECIMAL(12,2) NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  payment_method TEXT NOT NULL,
  amount_received DECIMAL(12,2),
  change_amount DECIMAL(12,2),
  table_number TEXT,
  pump_number TEXT,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create business_settings table for director to manage business details
CREATE TABLE public.business_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name TEXT NOT NULL DEFAULT 'HIPEMART OILS',
  address TEXT NOT NULL DEFAULT 'BUKHALIHA ROAD, BUSIA',
  phone TEXT NOT NULL DEFAULT '+256 776 429450',
  email TEXT DEFAULT 'info@hipemartoils.com',
  website TEXT DEFAULT 'www.hipemartoils.com',
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default business settings without updated_by for now
INSERT INTO public.business_settings (business_name, address, phone, email, website)
VALUES ('HIPEMART OILS', 'BUKHALIHA ROAD, BUSIA', '+256 776 429450', 'info@hipemartoils.com', 'www.hipemartoils.com');

-- Enable RLS on all tables
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for expenses
CREATE POLICY "Users can view expenses in their department" ON public.expenses
  FOR SELECT USING (true);

CREATE POLICY "Users can create expenses" ON public.expenses
  FOR INSERT WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "Accountants can update expenses" ON public.expenses
  FOR UPDATE USING (true);

-- RLS policies for receipts
CREATE POLICY "Users can view all receipts" ON public.receipts
  FOR SELECT USING (true);

CREATE POLICY "Users can create receipts" ON public.receipts
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- RLS policies for business settings
CREATE POLICY "Everyone can view business settings" ON public.business_settings
  FOR SELECT USING (true);

CREATE POLICY "Directors can update business settings" ON public.business_settings
  FOR UPDATE USING (true);
