-- Create fuel tank inventory table to track underground tank levels
CREATE TABLE public.fuel_tank_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fuel_type TEXT NOT NULL CHECK (fuel_type IN ('petrol', 'diesel', 'kerosene')),
  tank_capacity NUMERIC NOT NULL DEFAULT 0,
  current_level NUMERIC NOT NULL DEFAULT 0,
  last_refill_amount NUMERIC DEFAULT 0,
  last_refill_date DATE,
  updated_by UUID NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.fuel_tank_inventory ENABLE ROW LEVEL SECURITY;

-- Create policies for fuel tank inventory
CREATE POLICY "Everyone can view fuel tank inventory" 
ON public.fuel_tank_inventory 
FOR SELECT 
USING (true);

CREATE POLICY "Managers and directors can update fuel tank inventory" 
ON public.fuel_tank_inventory 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('manager', 'director')
  )
);

-- Add pump_fuel_sold column to fuel_entries table
ALTER TABLE public.fuel_entries 
ADD COLUMN pump_fuel_sold NUMERIC DEFAULT 0;

-- Create trigger for automatic timestamp updates on fuel_tank_inventory
CREATE TRIGGER update_fuel_tank_inventory_updated_at
BEFORE UPDATE ON public.fuel_tank_inventory
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default tank records for each fuel type
INSERT INTO public.fuel_tank_inventory (fuel_type, tank_capacity, current_level, updated_by)
SELECT 
  fuel_type,
  10000 as tank_capacity, -- Default 10,000L capacity
  0 as current_level,
  (SELECT id FROM public.profiles WHERE role = 'director' LIMIT 1) as updated_by
FROM (VALUES ('petrol'), ('diesel'), ('kerosene')) AS fuel_types(fuel_type);