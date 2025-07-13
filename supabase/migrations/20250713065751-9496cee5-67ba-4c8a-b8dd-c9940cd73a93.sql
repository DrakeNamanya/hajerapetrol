-- Create a purchase order requests table for the approval workflow
CREATE TABLE IF NOT EXISTS public.purchase_order_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  department TEXT NOT NULL,
  requested_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_by_manager UUID,
  approved_by_director UUID,
  manager_approved_at TIMESTAMP WITH TIME ZONE,
  director_approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT
);

-- Enable RLS
ALTER TABLE public.purchase_order_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for purchase order requests
CREATE POLICY "Everyone can view purchase order requests" 
ON public.purchase_order_requests 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create purchase order requests" 
ON public.purchase_order_requests 
FOR INSERT 
WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "Managers and directors can update purchase order requests" 
ON public.purchase_order_requests 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('manager', 'director', 'accountant')
));

-- Add trigger for updated_at
CREATE TRIGGER update_purchase_order_requests_updated_at
  BEFORE UPDATE ON public.purchase_order_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();